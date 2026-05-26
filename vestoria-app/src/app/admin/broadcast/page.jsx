"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, getDocs, doc, writeBatch, serverTimestamp, onSnapshot, query, orderBy, limit, deleteDoc } from "firebase/firestore";
import { Megaphone, Send, Trash2, Users, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function BroadcastPage() {
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);
  const [history, setHistory] = useState([]);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    // Live user count
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUserCount(snap.size);
    });

    // Broadcast history
    const unsubHistory = onSnapshot(
      query(collection(db, "broadcasts"), orderBy("sentAt", "desc"), limit(10)),
      (snap) => {
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => { unsubUsers(); unsubHistory(); };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    const confirmSend = window.confirm(`Send this message to ALL ${userCount} users? This will appear in every user's notification feed.`);
    if (!confirmSend) return;

    setSending(true);
    setMsg(null);

    try {
      // 1. Get all users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => d.id);

      // 2. Write a notification to each user's subcollection (batch)
      const BATCH_SIZE = 400;
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = users.slice(i, i + BATCH_SIZE);
        chunk.forEach(uid => {
          const notifRef = doc(collection(db, "users", uid, "notifications"));
          batch.set(notifRef, {
            title: form.title,
            message: form.message,
            type: form.type,
            read: false,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      // 3. Save to broadcast history
      const histRef = doc(collection(db, "broadcasts"));
      const batchHistory = writeBatch(db);
      batchHistory.set(histRef, {
        ...form,
        sentAt: serverTimestamp(),
        recipientCount: users.length,
      });
      await batchHistory.commit();

      setMsg({ type: "success", text: `✅ Broadcast sent to ${users.length} users successfully!` });
      setForm({ title: "", message: "", type: "info" });

    } catch (err) {
      setMsg({ type: "error", text: "Failed to send: " + err.message });
    } finally {
      setSending(false);
    }
  };

  const deleteHistory = async (id) => {
    if (window.confirm("Delete this broadcast record?")) {
      await deleteDoc(doc(db, "broadcasts", id));
    }
  };

  const typeColors = {
    info: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    success: "text-green-400 bg-green-500/10 border-green-500/30",
    warning: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    danger: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-pink-400" /> Mass Broadcast
          </h2>
          <p className="text-gray-400 text-sm mt-1">Send a push notification/message to every user on the platform instantly.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-xl">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-bold text-sm">{userCount} Total Recipients</span>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${msg.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="font-medium text-sm">{msg.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Compose Form */}
        <div className="xl:col-span-2 bg-gray-800 border border-gray-700 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Send className="w-5 h-5 text-pink-400" /> Compose Message
          </h3>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Message Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 🎉 Special Bonus Available!"
                className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-pink-400 transition"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Message Body</label>
              <textarea
                rows="4"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Write your announcement here..."
                className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-pink-400 transition resize-none"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Message Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-pink-400 transition"
              >
                <option value="info">ℹ️ Info (Blue)</option>
                <option value="success">✅ Success (Green)</option>
                <option value="warning">⚠️ Warning (Orange)</option>
                <option value="danger">🚨 Alert (Red)</option>
              </select>
            </div>

            {/* Preview */}
            {form.title && (
              <div className={`p-4 rounded-xl border ${typeColors[form.type]}`}>
                <p className="font-bold text-sm">{form.title}</p>
                <p className="text-xs opacity-80 mt-1">{form.message || "..."}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {sending ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending to {userCount} users...</>
              ) : (
                <><Send className="w-5 h-5" /> Send Broadcast Now</>
              )}
            </button>
          </form>
        </div>

        {/* Broadcast History */}
        <div className="xl:col-span-3 bg-gray-800 border border-gray-700 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-5">Recent Broadcasts</h3>
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No broadcasts sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className={`p-4 rounded-2xl border flex justify-between items-start gap-4 ${typeColors[h.type]}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm">{h.title}</p>
                      <span className="text-[10px] font-bold uppercase opacity-60 bg-black/20 px-2 py-0.5 rounded-full">{h.type}</span>
                    </div>
                    <p className="text-xs opacity-80 line-clamp-2">{h.message}</p>
                    <p className="text-[10px] opacity-50 mt-2">
                      Sent to {h.recipientCount} users • {h.sentAt ? new Date(h.sentAt.seconds * 1000).toLocaleString() : "Just now"}
                    </p>
                  </div>
                  <button onClick={() => deleteHistory(h.id)} className="p-2 hover:bg-black/20 rounded-lg transition flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
