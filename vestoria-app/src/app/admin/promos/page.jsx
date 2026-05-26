"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Gift, Plus, Trash2, Edit3, Save, X } from "lucide-react";

export default function PromoCodes() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [maxUsage, setMaxUsage] = useState("");

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "promocodes")), (snap) => {
      setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unSub();
  }, []);

  const savePromo = async (e) => {
    e.preventDefault();
    if (!code || !amount || !maxUsage) return;
    
    try {
      const promoId = code.toUpperCase().replace(/\s+/g, '');
      await setDoc(doc(db, "promocodes", promoId), {
        code: promoId,
        amount: Number(amount),
        maxUsage: Number(maxUsage),
        usedCount: 0,
        createdAt: serverTimestamp(),
        active: true
      });
      setShowModal(false);
      setCode("");
      setAmount("");
      setMaxUsage("");
    } catch (err) {
      alert("Error saving promo code.");
    }
  };

  const deletePromo = async (id) => {
    if (window.confirm("Delete this promo code permanently?")) {
      await deleteDoc(doc(db, "promocodes", id));
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-400" /> Promo & Bonus Codes
          </h2>
          <p className="text-gray-400 text-sm mt-1">Create reward codes to distribute free balance to users.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:brightness-110 text-white px-6 py-3 rounded-xl transition font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create Promo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-gray-700 rounded-3xl bg-gray-900/50">
            <Gift className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No promo codes active.</p>
          </div>
        ) : (
          promos.map(p => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 relative overflow-hidden group hover:border-pink-500/50 transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full -z-10 group-hover:scale-125 transition-transform" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-lg">
                  <p className="font-mono text-lg font-bold text-pink-400 tracking-wider">{p.code}</p>
                </div>
                <button onClick={() => deletePromo(p.id)} className="p-2 text-gray-500 hover:text-red-400 bg-gray-800 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-xl">
                  <span className="text-gray-400 text-sm">Reward Amount</span>
                  <span className="text-white font-bold">Rs. {p.amount}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-xl">
                  <span className="text-gray-400 text-sm">Usage Status</span>
                  <span className="text-gray-300 font-bold">{p.usedCount} / {p.maxUsage}</span>
                </div>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-full" 
                  style={{ width: `${(p.usedCount / p.maxUsage) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-6 md:p-8 rounded-3xl w-full max-w-md relative shadow-2xl shadow-pink-500/10">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 p-2 rounded-xl">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-white mb-2">Create Promo</h3>
            <p className="text-gray-400 text-sm mb-6">Generate a new reward code for your users.</p>
            
            <form onSubmit={savePromo} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Promo Code Name</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => setCode(e.target.value.toUpperCase())} 
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white font-mono outline-none focus:border-pink-500 transition uppercase" 
                  placeholder="e.g. EID2025"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Reward Amount (Rs.)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-pink-500 transition" 
                  placeholder="e.g. 500"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Max Usage Limit</label>
                <input 
                  type="number" 
                  value={maxUsage} 
                  onChange={e => setMaxUsage(e.target.value)} 
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-pink-500 transition" 
                  placeholder="e.g. 100 (first 100 users)"
                  required 
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-500 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-pink-500/20">
                  <Save className="w-5 h-5" /> Generate Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
