"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, limit } from "firebase/firestore";
import { MessageSquare, CheckCircle, Clock, X, Send } from "lucide-react";

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "tickets"), limit(100)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (a.status !== 'open' && b.status === 'open') return 1;
        return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0);
      });
      setTickets(data);
      setLoading(false);
      
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });
    return () => unSub();
  }, [selectedTicket]);

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const newReply = {
        sender: "admin",
        text: replyText,
        timestamp: new Date().toISOString()
      };

      await updateDoc(doc(db, "tickets", selectedTicket.id), {
        replies: [...(selectedTicket.replies || []), newReply],
        updatedAt: serverTimestamp(),
        status: "open" // keep open if admin replies
      });

      setReplyText("");
    } catch(err) {
      alert("Error sending reply");
    }
  };

  const closeTicket = async (id) => {
    if(window.confirm("Close this ticket?")) {
      await updateDoc(doc(db, "tickets", id), { status: "closed", updatedAt: serverTimestamp() });
      if(selectedTicket?.id === id) setSelectedTicket(null);
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Tickets List */}
      <div className={`w-full ${selectedTicket ? 'hidden md:block md:w-1/3' : 'md:w-1/3'} bg-gray-900 border border-gray-800 rounded-3xl flex flex-col overflow-hidden`}>
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" /> Support Tickets
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage user queries.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tickets.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No tickets found.</p>
          ) : (
            tickets.map(t => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicket(t)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                  selectedTicket?.id === t.id 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-gray-800 border-transparent hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${t.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {t.status}
                  </span>
                  <span className="text-[10px] text-gray-500">{t.createdAt ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                </div>
                <h3 className="font-bold text-sm text-white truncate">{t.subject}</h3>
                <p className="text-xs text-gray-400 truncate mt-1">{t.userEmail}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Chat / Detail */}
      {selectedTicket ? (
        <div className="w-full md:w-2/3 bg-gray-900 border border-gray-800 rounded-3xl flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
            <div>
              <h2 className="text-lg font-bold text-white">{selectedTicket.subject}</h2>
              <p className="text-xs text-gray-400">User: {selectedTicket.userEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedTicket.status === 'open' && (
                <button 
                  onClick={() => closeTicket(selectedTicket.id)}
                  className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Close Ticket
                </button>
              )}
              <button className="md:hidden p-2 bg-gray-800 rounded-xl" onClick={() => setSelectedTicket(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Original Message */}
            <div className="flex flex-col items-start max-w-[85%]">
              <span className="text-[10px] text-gray-500 ml-1 mb-1">{selectedTicket.userName || 'User'}</span>
              <div className="bg-gray-800 text-gray-200 p-4 rounded-2xl rounded-tl-none border border-gray-700">
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
            </div>

            {/* Replies */}
            {selectedTicket.replies?.map((r, i) => (
              <div key={i} className={`flex flex-col ${r.sender === 'admin' ? 'items-end' : 'items-start'} max-w-[85%] ${r.sender === 'admin' ? 'ml-auto' : ''}`}>
                <span className="text-[10px] text-gray-500 mb-1 mx-1">{r.sender === 'admin' ? 'Support Agent (You)' : selectedTicket.userName || 'User'}</span>
                <div className={`p-4 rounded-2xl text-sm whitespace-pre-wrap ${
                  r.sender === 'admin' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20' 
                    : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                }`}>
                  {r.text}
                </div>
              </div>
            ))}
          </div>

          {/* Reply Input */}
          {selectedTicket.status === 'open' ? (
            <div className="p-4 bg-gray-800/50 border-t border-gray-800">
              <form onSubmit={sendReply} className="flex gap-2">
                <input 
                  type="text" 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  placeholder="Type your reply to the user..." 
                  className="flex-1 bg-gray-900 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition"
                  required
                />
                <button 
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-blue-500 text-white p-4 rounded-xl font-bold hover:bg-blue-400 disabled:opacity-50 transition flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-gray-800/50 border-t border-gray-800 text-center">
              <p className="text-sm text-gray-500">This ticket has been closed.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-900 border border-gray-800 rounded-3xl">
          <div className="text-center text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Select a ticket to view conversation</p>
          </div>
        </div>
      )}

    </div>
  );
}
