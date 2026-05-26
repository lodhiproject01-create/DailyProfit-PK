"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useStore } from "@/store/useStore";
import { Bell, CheckCircle2, AlertTriangle, Info, Trash2, CheckCircle } from "lucide-react";

export default function NotificationsPage() {
  const { userData } = useStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) return;

    const q = query(
      collection(db, "users", userData.id, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [userData?.id]);

  const markAsRead = async (id) => {
    if (!userData?.id) return;
    await updateDoc(doc(db, "users", userData.id, "notifications", id), { read: true });
  };

  const markAllAsRead = async () => {
    if (!userData?.id || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, "users", userData.id, "notifications", n.id), { read: true });
      }
    });
    await batch.commit();
  };

  const deleteAll = async () => {
    if (!userData?.id || notifications.length === 0) return;
    if (!window.confirm("Delete all notifications permanently?")) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, "users", userData.id, "notifications", n.id));
    });
    await batch.commit();
  };

  const getTypeStyle = (type) => {
    switch(type) {
      case 'success': return "border-green-500/30 bg-green-500/10 text-green-400";
      case 'warning': return "border-orange-500/30 bg-orange-500/10 text-orange-400";
      case 'danger': return "border-red-500/30 bg-red-500/10 text-red-400";
      default: return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'danger': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-pink-400" /> Notifications
          </h2>
          <p className="text-gray-400 text-sm mt-1">Your personal alerts and system messages.</p>
        </div>
        <div className="flex gap-2">
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead}
              className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-xl transition flex items-center gap-1 text-sm"
              title="Mark all as read"
            >
              <CheckCircle className="w-4 h-4" /> <span className="hidden md:inline">Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={deleteAll}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 p-2 rounded-xl transition flex items-center gap-1 text-sm"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" /> <span className="hidden md:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-3xl border border-gray-700">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => !n.read && markAsRead(n.id)}
              className={`p-4 rounded-2xl border flex gap-4 transition cursor-pointer ${n.read ? 'bg-gray-800 border-gray-700 opacity-70' : getTypeStyle(n.type)}`}
            >
              <div className="mt-0.5">{getTypeIcon(n.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2">
                  <h3 className={`font-bold ${!n.read ? 'text-white' : 'text-gray-300'}`}>{n.title}</h3>
                  {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className={`text-sm mt-1 ${!n.read ? 'opacity-90' : 'text-gray-400'}`}>{n.message}</p>
                <p className="text-[10px] opacity-50 mt-2">
                  {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
