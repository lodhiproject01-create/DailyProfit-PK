"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import { Gift, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function Rewards() {
  const { userData } = useStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const claimCode = async (e) => {
    e.preventDefault();
    if (!userData) return;
    if (!code.trim()) return setMsg({ type: "error", text: "Please enter a valid code." });

    setLoading(true);
    setMsg(null);
    const promoId = code.toUpperCase().replace(/\s+/g, '');

    try {
      // 1. Check if promo exists
      const promoRef = doc(db, "promocodes", promoId);
      const promoSnap = await getDoc(promoRef);

      if (!promoSnap.exists() || !promoSnap.data().active) {
        setLoading(false);
        return setMsg({ type: "error", text: "Invalid or expired promo code." });
      }

      const promoData = promoSnap.data();

      // 2. Check if user already claimed it
      const claimRef = doc(db, `users/${userData.id}/claims`, promoId);
      const claimSnap = await getDoc(claimRef);
      if (claimSnap.exists()) {
        setLoading(false);
        return setMsg({ type: "error", text: "You have already claimed this code." });
      }

      // 3. Check usage limit
      if (promoData.usedCount >= promoData.maxUsage) {
        setLoading(false);
        return setMsg({ type: "error", text: "This promo code has reached its maximum usage limit." });
      }

      // 4. Update Everything
      // Increase promo usedCount
      await updateDoc(promoRef, { usedCount: increment(1) });
      
      // Add balance to user
      const userRef = doc(db, "users", userData.id);
      await updateDoc(userRef, { balance: increment(promoData.amount) });

      // Mark as claimed
      await setDoc(claimRef, { claimedAt: serverTimestamp(), amount: promoData.amount });

      setMsg({ type: "success", text: `✅ Successfully claimed Rs. ${promoData.amount}!` });
      setCode("");

    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Gift className="w-8 h-8 text-pink-500" /> Rewards Center
        </h1>
        <p className="text-gray-400 mt-1">Claim your promo codes for free bonus balance.</p>
      </div>

      <div className="bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-bl-full -z-10" />
        
        <h3 className="font-bold text-white mb-6">Enter Promo Code</h3>

        {msg && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 border ${msg.type === "success" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
            {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={claimCode} className="space-y-4">
          <input 
            type="text" 
            value={code} 
            onChange={e => setCode(e.target.value)} 
            placeholder="e.g. EID2025" 
            className="w-full bg-gray-900 border border-gray-700 p-4 rounded-xl text-white font-mono outline-none focus:border-pink-500 transition text-center text-xl uppercase tracking-widest placeholder-gray-600"
            required 
          />
          <button 
            type="submit" 
            disabled={loading || !code.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:brightness-110 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-pink-500/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>Redeem Code <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
        <h4 className="font-bold text-white mb-2">How to get Promo Codes?</h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          Promo codes are distributed on our official WhatsApp and Telegram channels during special events. Make sure to join our community to never miss free rewards!
        </p>
      </div>
    </div>
  );
}
