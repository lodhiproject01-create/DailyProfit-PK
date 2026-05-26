"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { MessageSquare, Plus, CheckCircle, Send, X } from "lucide-react";

export default function UserSupport() {
  const { userData } = useStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Chat States
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Forms
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userData?.id) return;
    const unSub = onSnapshot(query(collection(db, "tickets"), where("userId", "==", userData.id)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a,b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setTickets(data);
      setLoading(false);

      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });
    return () => unSub();
  }, [userData, selectedTicket]);

  const createTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    setSubmitting(true);
    try {
      const newRef = doc(collection(db, "tickets"));
      await setDoc(newRef, {
        userId: userData.id,
        userName: userData.name,
        userEmail: userData.email,
        subject: newSubject,
        message: newMessage,
        status: "open",
        replies: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewSubject("");
      setNewMessage("");
      alert("Ticket created successfully! Support team will review it.");
    } catch (err) {
      alert("Error creating ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    
    try {
      const newReply = {
        sender: "user",
        text: replyText,
        timestamp: new Date().toISOString()
      };

      await updateDoc(doc(db, "tickets", selectedTicket.id), {
        replies: [...(selectedTicket.replies || []), newReply],
        updatedAt: serverTimestamp(),
        status: "open" // reopen ticket if user replies
      });

      setReplyText("");
    } catch(err) {
      alert("Error sending reply");
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-800 rounded-3xl" />;

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] pb-16 md:pb-0">
      
      {/* Tickets List View */}
      <div className={`w-full ${selectedTicket ? 'hidden md:flex' : 'flex'} md:w-1/3 bg-gray-800 border border-gray-700 rounded-3xl flex-col overflow-hidden`}>
        <div className="p-6 border-b border-gray-700 bg-gray-800/80">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" /> Support
          </h2>
          <p className="text-sm text-gray-400 mt-1 mb-4">Need help? Open a ticket.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tickets.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">No support tickets found.</p>
          ) : (
            tickets.map(t => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicket(t)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                  selectedTicket?.id === t.id 
                    ? 'bg-cyan-500/10 border-cyan-500/30' 
                    : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${t.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {t.status}
                  </span>
                  <span className="text-[10px] text-gray-500">{t.createdAt ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                </div>
                <h3 className="font-bold text-sm text-white truncate">{t.subject}</h3>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Chat View */}
      {selectedTicket ? (
        <div className="w-full md:w-2/3 bg-gray-800 border border-gray-700 rounded-3xl flex flex-col overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 bg-gray-800 rounded-xl" onClick={() => setSelectedTicket(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h2 className="text-sm md:text-lg font-bold text-white truncate max-w-[200px] md:max-w-xs">{selectedTicket.subject}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${selectedTicket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {selectedTicket.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Initial Message */}
            <div className="flex flex-col items-end max-w-[85%] ml-auto">
              <span className="text-[10px] text-gray-500 mr-1 mb-1">You</span>
              <div className="bg-cyan-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
            </div>

            {/* Replies */}
            {selectedTicket.replies?.map((r, i) => (
              <div key={i} className={`flex flex-col ${r.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%] ${r.sender === 'user' ? 'ml-auto' : ''}`}>
                <span className="text-[10px] text-gray-500 mx-1 mb-1">{r.sender === 'user' ? 'You' : 'Support Team'}</span>
                <div className={`p-4 rounded-2xl text-sm whitespace-pre-wrap ${
                  r.sender === 'user' 
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-gray-900 text-gray-200 rounded-tl-none border border-gray-700'
                }`}>
                  {r.text}
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          {selectedTicket.status === 'closed' ? (
            <div className="p-4 bg-gray-900/50 border-t border-gray-700 text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> This ticket is closed.</p>
            </div>
          ) : (
            <div className="p-3 md:p-4 bg-gray-900/50 border-t border-gray-700">
              <form onSubmit={sendReply} className="flex gap-2">
                <input 
                  type="text" 
                  value={replyText} 
                  onChange={e => setReplyText(e.target.value)} 
                  placeholder="Type your message..." 
                  className="flex-1 bg-gray-800 border border-gray-600 p-3 rounded-xl text-white outline-none focus:border-cyan-500 transition"
                  required
                />
                <button 
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-cyan-500 text-gray-900 p-3 rounded-xl font-bold hover:bg-cyan-400 disabled:opacity-50 transition flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-800 border border-gray-700 rounded-3xl">
          <div className="text-center text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Select a ticket or create a new one</p>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-white">Create Support Ticket</h3>
            <form onSubmit={createTicket} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Subject</label>
                <input 
                  type="text" 
                  value={newSubject} 
                  onChange={e => setNewSubject(e.target.value)} 
                  placeholder="e.g. Deposit not received" 
                  className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-cyan-500 border border-gray-700 text-white" 
                  required 
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Description</label>
                <textarea 
                  rows="4" 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)} 
                  placeholder="Explain your issue in detail..." 
                  className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-cyan-500 border border-gray-700 text-white resize-none" 
                  required 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)} 
                  className="flex-1 bg-gray-800 py-3 rounded-xl font-bold hover:bg-gray-700 text-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-cyan-500 text-gray-900 py-3 rounded-xl font-bold hover:brightness-110 disabled:opacity-50 transition"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
