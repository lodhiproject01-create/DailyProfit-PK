"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ListTodo, Plus, Trash2, Edit3, Save, X, ExternalLink } from "lucide-react";

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [reward, setReward] = useState("");

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "tasks")), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unSub();
  }, []);

  const saveTask = async (e) => {
    e.preventDefault();
    if (!title || !link || !reward) return;
    
    try {
      const taskId = "TASK-" + Date.now();
      await setDoc(doc(db, "tasks", taskId), {
        title,
        link,
        reward: Number(reward),
        createdAt: serverTimestamp(),
        active: true
      });
      setShowModal(false);
      setTitle("");
      setLink("");
      setReward("");
    } catch (err) {
      alert("Error saving task.");
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm("Delete this task? Users won't be able to earn from it anymore.")) {
      await deleteDoc(doc(db, "tasks", id));
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-orange-400" /> Task Center (Watch & Earn)
          </h2>
          <p className="text-gray-400 text-sm mt-1">Create micro-tasks like 'Subscribe to YouTube' for users to earn free balance.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-110 text-white px-6 py-3 rounded-xl transition font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-gray-700 rounded-3xl bg-gray-900/50">
            <ListTodo className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No active tasks found.</p>
          </div>
        ) : (
          tasks.map(t => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -z-10 group-hover:scale-125 transition-transform" />
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-white leading-tight pr-4">{t.title}</h3>
                <button onClick={() => deleteTask(t.id)} className="p-2 text-gray-500 hover:text-red-400 bg-gray-800 rounded-lg transition flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-6 truncate">
                <ExternalLink className="w-3 h-3" /> {t.link}
              </a>

              <div className="mt-auto flex justify-between items-center bg-gray-800 p-3 rounded-xl border border-gray-700">
                <span className="text-gray-400 text-sm font-medium">Task Reward</span>
                <span className="text-orange-400 font-extrabold text-xl">Rs. {t.reward}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-6 md:p-8 rounded-3xl w-full max-w-md relative shadow-2xl shadow-orange-500/10">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 p-2 rounded-xl">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-white mb-2">Create Micro-Task</h3>
            <p className="text-gray-400 text-sm mb-6">Users will visit this link to claim their reward.</p>
            
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Task Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-orange-500 transition" 
                  placeholder="e.g. Subscribe to our YouTube Channel"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Action Link (URL)</label>
                <input 
                  type="url" 
                  value={link} 
                  onChange={e => setLink(e.target.value)} 
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-orange-500 transition" 
                  placeholder="https://youtube.com/..."
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Reward Amount (Rs.)</label>
                <input 
                  type="number" 
                  value={reward} 
                  onChange={e => setReward(e.target.value)} 
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-orange-500 transition" 
                  placeholder="e.g. 10"
                  required 
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-orange-500/20">
                  <Save className="w-5 h-5" /> Publish Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
