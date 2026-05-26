"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, getDoc, updateDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import { ListTodo, CheckCircle2, AlertTriangle, PlayCircle, ExternalLink } from "lucide-react";

export default function UserTasks() {
  const { userData } = useStore();
  const [tasks, setTasks] = useState([]);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!userData) return;

    // Fetch active tasks
    const unSubTasks = onSnapshot(query(collection(db, "tasks")), (snap) => {
      const allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(allTasks.filter(t => t.active !== false));
      setLoading(false);
    });

    // Fetch user completed tasks
    const unSubCompleted = onSnapshot(collection(db, `users/${userData.id}/completedTasks`), (snap) => {
      setCompletedTaskIds(snap.docs.map(d => d.id));
    });

    return () => { unSubTasks(); unSubCompleted(); };
  }, [userData]);

  const claimTask = async (task) => {
    if (!userData) return;
    setClaiming(task.id);
    setMsg(null);

    try {
      // Small artificial delay to simulate "verification"
      await new Promise(res => setTimeout(res, 2000));

      const claimRef = doc(db, `users/${userData.id}/completedTasks`, task.id);
      const claimSnap = await getDoc(claimRef);

      if (claimSnap.exists()) {
        setMsg({ type: "error", text: "You have already completed this task." });
        setClaiming(null);
        return;
      }

      // Add balance
      const userRef = doc(db, "users", userData.id);
      await updateDoc(userRef, { balance: increment(task.reward) });

      // Mark completed
      await setDoc(claimRef, { completedAt: serverTimestamp(), reward: task.reward });

      setMsg({ type: "success", text: `✅ Task completed! Rs. ${task.reward} added to your balance.` });
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Failed to verify task. Try again." });
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ListTodo className="w-8 h-8 text-orange-400" /> Watch & Earn
        </h1>
        <p className="text-gray-400 mt-1">Complete simple micro-tasks to earn free daily balance.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${msg.type === "success" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse w-full h-40 bg-gray-900 rounded-3xl" />
      ) : tasks.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-700 rounded-3xl bg-gray-900/50">
          <ListTodo className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No tasks available today. Check back tomorrow!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map(t => {
            const isCompleted = completedTaskIds.includes(t.id);

            return (
              <div key={t.id} className="bg-gray-800 border border-gray-700 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -z-10 group-hover:scale-125 transition-transform" />
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-white leading-tight pr-4">{t.title}</h3>
                  <div className="bg-gray-900 border border-gray-700 px-3 py-1 rounded-xl whitespace-nowrap">
                    <span className="text-orange-400 font-extrabold">+ Rs. {t.reward}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-6 flex items-center gap-1">
                  <PlayCircle className="w-4 h-4" /> Watch / Visit to earn reward
                </p>

                {isCompleted ? (
                  <button disabled className="w-full bg-gray-900 border border-gray-700 text-gray-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    <CheckCircle2 className="w-5 h-5" /> Task Completed
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <a 
                      href={t.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-gray-900 hover:bg-gray-700 border border-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      Step 1: Visit <ExternalLink className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => claimTask(t)}
                      disabled={claiming === t.id}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-110 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/20"
                    >
                      {claiming === t.id ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Step 2: Claim"
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
