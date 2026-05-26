"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Megaphone, Plus, Trash2, Save, X, AlertTriangle } from "lucide-react";

export default function MarketingTools() {
  const [fakePayouts, setFakePayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "fakePayouts")), (snap) => {
      setFakePayouts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unSub();
  }, []);

  const saveFakePayout = async (e) => {
    e.preventDefault();
    if (!email || !amount) return;
    
    try {
      const id = "FAKE-" + Date.now();
      await setDoc(doc(db, "fakePayouts", id), {
        email,
        amount: Number(amount),
        timestamp: serverTimestamp(),
      });
      setShowModal(false);
      setEmail("");
      setAmount("");
    } catch (err) {
      alert("Error saving fake payout.");
    }
  };

  const deletePayout = async (id) => {
    if (window.confirm("Remove this from the live ticker?")) {
      await deleteDoc(doc(db, "fakePayouts", id));
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-pink-500" /> Marketing & Fake Payouts
          </h2>
          <p className="text-gray-400 text-sm mt-1">Add fake withdrawals to the landing page ticker to boost trust and conversion rates.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white px-6 py-3 rounded-xl transition font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Fake Payout
        </button>
      </div>

      <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-yellow-400 font-bold text-sm">Marketing Use Only</h4>
          <p className="text-gray-400 text-xs mt-1">These payouts will ONLY appear on the landing page's scrolling ticker. They do not affect actual financial records or user balances.</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-800/50 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-4 font-medium">Added On</th>
              <th className="p-4 font-medium">Fake Email/Name</th>
              <th className="p-4 font-medium">Fake Amount</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fakePayouts.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">No fake payouts active.</td>
              </tr>
            ) : (
              fakePayouts.map(p => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition">
                  <td className="p-4 text-gray-500">
                    {p.timestamp ? new Date(p.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                  </td>
                  <td className="p-4 font-bold text-white">{p.email}</td>
                  <td className="p-4 text-green-400 font-bold">Rs. {p.amount}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => deletePayout(p.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-6 md:p-8 rounded-3xl w-full max-w-md relative shadow-2xl shadow-pink-500/10">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 p-2 rounded-xl">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-white mb-2">Create Fake Payout</h3>
            <p className="text-gray-400 text-sm mb-6">This will immediately appear on the landing page.</p>
            
            <form onSubmit={saveFakePayout} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Name or Email (e.g. ali_hassan@...)</label>
                <input 
                  type="text" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-pink-500 transition" 
                  placeholder="e.g. kamran.khan"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Amount (Rs.)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="w-full bg-gray-800 border border-gray-700 p-4 rounded-xl text-white outline-none focus:border-pink-500 transition" 
                  placeholder="e.g. 5000"
                  required 
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-pink-500/20">
                  <Save className="w-5 h-5" /> Broadcast Fake Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
