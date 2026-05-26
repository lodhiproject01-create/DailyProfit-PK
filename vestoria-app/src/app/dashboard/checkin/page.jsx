"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { CalendarCheck, Gift, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function DailyCheckin() {
  const { userData } = useStore();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [lastClaimDate, setLastClaimDate] = useState(null);
  const REWARD_AMOUNT = 20;

  useEffect(() => {
    if (!userData?.id) return;
    const checkStatus = async () => {
      try {
        const userRef = doc(db, "users", userData.id);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.lastCheckIn) {
            const lastDate = new Date(data.lastCheckIn.seconds * 1000);
            setLastClaimDate(lastDate);
            
            // Check if last claim was today
            const today = new Date();
            const isToday = lastDate.getDate() === today.getDate() && 
                            lastDate.getMonth() === today.getMonth() && 
                            lastDate.getFullYear() === today.getFullYear();
            
            setCanClaim(!isToday);
          } else {
            setCanClaim(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [userData]);

  const handleClaim = async () => {
    if (!userData || !canClaim) return;
    setClaiming(true);
    setMsg(null);

    try {
      const userRef = doc(db, "users", userData.id);
      
      // Update balance and last checkin time
      await updateDoc(userRef, {
        balance: increment(REWARD_AMOUNT),
        lastCheckIn: serverTimestamp()
      });

      setMsg({ type: "success", text: `✅ Rs. ${REWARD_AMOUNT} Daily Bonus claimed successfully!` });
      setCanClaim(false);
      setLastClaimDate(new Date()); // Optimistic update
    } catch (err) {
      setMsg({ type: "error", text: "Error claiming bonus. Try again." });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/20">
          <CalendarCheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Daily Check-In</h1>
        <p className="text-gray-400 mt-2">Come back every day to claim your free reward!</p>
      </div>

      <div className="bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-700 relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-full -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-tr-full -z-10" />
        
        <h3 className="font-bold text-gray-300 mb-2">Today's Reward</h3>
        <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
          Rs. {REWARD_AMOUNT}
        </p>

        {msg && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 justify-center border ${msg.type === "success" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
            {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {msg.text}
          </div>
        )}

        {canClaim ? (
          <button 
            onClick={handleClaim}
            disabled={claiming}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:brightness-110 disabled:opacity-50 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 transition shadow-xl shadow-yellow-500/20 text-lg"
          >
            {claiming ? (
              <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>Claim Reward Now <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            <button 
              disabled
              className="w-full bg-gray-900 border border-gray-700 text-gray-500 font-bold py-5 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed text-lg"
            >
              <CheckCircle2 className="w-6 h-6" /> Already Claimed Today
            </button>
            <p className="text-sm text-gray-400">
              Come back tomorrow for your next reward!
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex gap-4 items-start">
        <Gift className="w-8 h-8 text-yellow-500 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-white mb-1">Consistency is Key</h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Every day you log into the DailyProfit PK platform, you get free balance added directly to your Main Wallet. Make it a habit and watch your earnings grow without any investment!
          </p>
        </div>
      </div>
    </div>
  );
}
