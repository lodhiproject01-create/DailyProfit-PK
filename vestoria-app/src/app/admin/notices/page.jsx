"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Bell, Plus, Trash2, Edit2 } from "lucide-react";

export default function GlobalNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [editingNotice, setEditingNotice] = useState(null);
  const [form, setForm] = useState({ title: "", message: "", type: "info", active: true });

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "notices")), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0)));
      setLoading(false);
    });
    return () => unSub();
  }, []);

  const saveNotice = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { ...form, timestamp: serverTimestamp() };

      if (editingNotice === 'new') {
        await setDoc(doc(collection(db, "notices")), dataToSave);
      } else {
        await updateDoc(doc(db, "notices", editingNotice.id), form);
      }
      setEditingNotice(null);
    } catch(err) { alert("Error saving notice"); }
  };

  const deleteNotice = async (id) => {
    if(window.confirm("Delete this notice permanently?")) {
      await deleteDoc(doc(db, "notices", id));
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  const getTypeStyle = (type) => {
    if (type === 'success') return "text-green-400 bg-green-500/10 border-green-500/30";
    if (type === 'warning') return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    if (type === 'danger') return "text-red-400 bg-red-500/10 border-red-500/30";
    return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-400" /> Global Notices
          </h2>
          <p className="text-gray-400 text-sm mt-1">Publish important announcements to all users' dashboards.</p>
        </div>
        <button 
          onClick={() => { setEditingNotice('new'); setForm({ title: "", message: "", type: "info", active: true }); }}
          className="bg-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" /> Create Notice
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notices created yet.</p>
        ) : (
          notices.map(n => (
            <div key={n.id} className={`p-6 rounded-2xl border flex flex-col md:flex-row md:justify-between md:items-center gap-4 ${getTypeStyle(n.type)}`}>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{n.title}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${n.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                    {n.active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <p className="text-sm opacity-90">{n.message}</p>
                <p className="text-[10px] opacity-50 mt-2">Posted: {n.timestamp ? new Date(n.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditingNotice(n); setForm(n); }} 
                  className="p-3 bg-gray-900/50 hover:bg-gray-900 rounded-xl transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteNotice(n.id)} 
                  className="p-3 bg-gray-900/50 hover:bg-gray-900 rounded-xl transition text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingNotice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-white">{editingNotice === 'new' ? 'Create New Notice' : 'Edit Notice'}</h3>
            <form onSubmit={saveNotice} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Notice Title</label>
                <input type="text" placeholder="e.g. Server Maintenance" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-yellow-500 border border-gray-700 text-white" required />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Message</label>
                <textarea rows="3" placeholder="Enter the announcement text..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-yellow-500 border border-gray-700 text-white resize-none" required />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Notice Type (Color Scheme)</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-yellow-500 border border-gray-700 text-white">
                  <option value="info">Info (Blue)</option>
                  <option value="success">Success (Green)</option>
                  <option value="warning">Warning (Orange)</option>
                  <option value="danger">Danger (Red)</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2 p-3 bg-gray-800 rounded-xl border border-gray-700">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4 accent-yellow-500" />
                <span className="text-sm font-bold text-white">Make Active (Visible to users)</span>
              </label>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingNotice(null)} className="flex-1 bg-gray-800 py-3 rounded-xl font-bold hover:bg-gray-700 text-white">Cancel</button>
                <button type="submit" className="flex-1 bg-yellow-500 text-gray-900 py-3 rounded-xl font-bold hover:brightness-110">Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
