"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function PlanManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({ 
    name: "", 
    price: 0, 
    dailyProfit: 0, 
    durationDays: 30, 
    color: "from-green-500 to-cyan-500", 
    popular: false 
  });

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "plans")), (snap) => {
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (Number(a.price) || 0) - (Number(b.price) || 0)));
      setLoading(false);
    });
    return () => unSub();
  }, []);

  const savePlan = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { 
        name: form.name || "", 
        price: Number(form.price) || 0, 
        dailyProfit: Number(form.dailyProfit) || 0, 
        durationDays: Number(form.durationDays) || 0, 
        color: form.color || "from-green-500 to-cyan-500",
        popular: !!form.popular
      };

      if (editingPlan === 'new') {
        // Generate a clean slug or custom ID based on name to make referencing neat
        const newRef = doc(collection(db, "plans"));
        await setDoc(newRef, dataToSave);
      } else {
        await updateDoc(doc(db, "plans", editingPlan.id), dataToSave);
      }
      setEditingPlan(null);
    } catch(err) {
      console.error(err);
      alert("Error saving plan: " + err.message);
    }
  };

  const deletePlan = async (id) => {
    if(window.confirm("Delete this plan? Users who already bought it won't be affected.")) {
      await deleteDoc(doc(db, "plans", id));
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Investment Plans</h2>
          <p className="text-gray-400 text-sm">Create and modify investment packages.</p>
        </div>
        <button 
          onClick={() => { 
            setEditingPlan('new'); 
            setForm({ 
              name: "", 
              price: 0, 
              dailyProfit: 0, 
              durationDays: 30, 
              color: "from-green-500 to-cyan-500", 
              popular: false 
            }); 
          }}
          className="bg-green-500 text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" /> Add New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(p => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl relative overflow-hidden group">
            {p.popular && (
              <div className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded">POPULAR</div>
            )}
            <div className={`h-1.5 absolute top-0 left-0 right-0 bg-gradient-to-r ${p.color}`} />
            
            <h3 className="text-xl font-bold text-white mb-4 mt-2">{p.name}</h3>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between bg-gray-800 p-3 rounded-xl">
                <span className="text-gray-400 text-sm">Price</span>
                <span className="text-white font-bold">Rs. {Number(p.price || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between bg-gray-800 p-3 rounded-xl">
                <span className="text-gray-400 text-sm">Daily Return</span>
                <span className="text-green-400 font-bold">Rs. {p.dailyProfit || 0}</span>
              </div>
              <div className="flex justify-between bg-gray-800 p-3 rounded-xl">
                <span className="text-gray-400 text-sm">Duration</span>
                <span className="text-white font-bold">{p.durationDays || 0} Days</span>
              </div>
              <div className="flex justify-between bg-gray-800 p-3 rounded-xl">
                <span className="text-gray-400 text-sm">Total Profit</span>
                <span className="text-cyan-400 font-bold">Rs. {Number((p.dailyProfit || 0) * (p.durationDays || 0)).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => { 
                  setEditingPlan(p); 
                  setForm({
                    name: p.name || "",
                    price: p.price || 0,
                    dailyProfit: p.dailyProfit || 0,
                    durationDays: p.durationDays || 30,
                    color: p.color || "from-green-500 to-cyan-500",
                    popular: !!p.popular
                  }); 
                }} 
                className="flex-1 flex justify-center items-center gap-2 bg-blue-500/10 text-blue-400 py-3 rounded-xl font-bold hover:bg-blue-500/20 transition"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button 
                onClick={() => deletePlan(p.id)} 
                className="flex items-center justify-center bg-red-500/10 text-red-500 p-3 rounded-xl hover:bg-red-500/20 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Form Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-white">{editingPlan === 'new' ? 'Create New Plan' : 'Edit Plan'}</h3>
            <form onSubmit={savePlan} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Plan Name</label>
                <input type="text" placeholder="e.g. Starter" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-green-500 border border-gray-700 text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Price (Rs)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-green-500 border border-gray-700 text-white" required />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Daily Profit (Rs)</label>
                  <input type="number" value={form.dailyProfit} onChange={e => setForm({...form, dailyProfit: e.target.value})} className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-green-500 border border-gray-700 text-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Duration (Days)</label>
                  <input type="number" value={form.durationDays} onChange={e => setForm({...form, durationDays: e.target.value})} className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-green-500 border border-gray-700 text-white" required />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">CSS Color</label>
                  <input type="text" placeholder="from-X to-Y" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full bg-gray-800 p-3 rounded-xl outline-none focus:border-green-500 border border-gray-700 text-white" required />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2 p-3 bg-gray-800 rounded-xl border border-gray-700">
                <input type="checkbox" checked={form.popular} onChange={e => setForm({...form, popular: e.target.checked})} className="w-4 h-4 accent-cyan-500" />
                <span className="text-sm font-bold text-white">Mark as Popular</span>
              </label>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingPlan(null)} className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700">Cancel</button>
                <button type="submit" className="flex-1 bg-green-500 text-gray-900 py-3 rounded-xl font-bold hover:brightness-110">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
