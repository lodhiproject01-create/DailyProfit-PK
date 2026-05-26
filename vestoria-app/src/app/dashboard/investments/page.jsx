"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { CheckCircle2, ShieldCheck, Zap, Activity, Lock } from "lucide-react";

export default function Investments() {
  const { userData, plans } = useStore();
  const [myInvestments, setMyInvestments] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [msg, setMsg] = useState(null);

  const planColors = [
    "from-green-500 to-cyan-500",
    "from-purple-500 to-blue-500",
    "from-orange-500 to-red-500",
    "from-pink-500 to-rose-500",
  ];

  useEffect(() => {
    if (!userData?.id) return;
    const fetchMyInvestments = async () => {
      const q = query(collection(db, "investments"), where("userId", "==", userData.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.startedAt?.seconds || 0) - (a.startedAt?.seconds || 0));
      setMyInvestments(data);
    };
    fetchMyInvestments();
  }, [userData]);

  const handleInvest = async (plan) => {
    if (!userData) return;
    if ((userData.balance || 0) < plan.price) {
      return setMsg({ type: "error", text: `Insufficient balance. You need Rs. ${plan.price}. Current balance: Rs. ${userData.balance || 0}` });
    }

    // Check if already has an active investment in this plan
    const existing = myInvestments.find(i => i.planId === plan.id && i.status === "active");
    if (existing) {
      return setMsg({ type: "error", text: "You already have an active investment in this plan." });
    }

    const confirmed = window.confirm(`Invest Rs. ${plan.price} in ${plan.name}?\n\nYou will earn Rs. ${plan.dailyProfit}/day for ${plan.durationDays} days.\nTotal return: Rs. ${plan.dailyProfit * plan.durationDays}`);
    if (!confirmed) return;

    setLoadingId(plan.id);
    setMsg(null);
    try {
      await addDoc(collection(db, "investments"), {
        userId: userData.id,
        email: userData.email,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        dailyProfit: plan.dailyProfit,
        durationDays: plan.durationDays,
        daysRemaining: plan.durationDays,
        status: "active",
        startedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "users", userData.id), {
        balance: (userData.balance || 0) - plan.price
      });

      setMsg({ type: "success", text: `✅ Successfully invested in ${plan.name}! Daily profit of Rs. ${plan.dailyProfit} starts now.` });

      // Refresh
      const q = query(collection(db, "investments"), where("userId", "==", userData.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.startedAt?.seconds || 0) - (a.startedAt?.seconds || 0));
      setMyInvestments(data);
    } catch (err) {
      setMsg({ type: "error", text: "Error processing investment. Try again." });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Investment Plans</h1>
        <p className="text-gray-400 mt-1">Choose a plan and start earning daily profits.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${msg.type === "success" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
          {msg.text}
        </div>
      )}

      {/* Balance indicator */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl px-6 py-4 flex items-center justify-between">
        <span className="text-gray-400 text-sm">Your Available Balance</span>
        <span className="text-2xl font-extrabold text-green-400">Rs. {userData?.balance || 0}</span>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => {
          const color = plan.color || planColors[i % planColors.length];
          const isActive = myInvestments.some(inv => inv.planId === plan.id && inv.status === "active");
          const canAfford = (userData?.balance || 0) >= plan.price;

          return (
            <div key={plan.id} className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden flex flex-col">
              <div className={`h-2 w-full bg-gradient-to-r ${color}`} />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {isActive && (
                    <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-bold">ACTIVE</span>
                  )}
                </div>
                <p className="text-4xl font-extrabold text-white mb-6">Rs. {plan.price?.toLocaleString()}</p>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex justify-between bg-gray-900 p-3 rounded-xl border border-gray-700">
                    <span className="text-gray-400 text-sm">Daily Profit</span>
                    <span className="font-bold text-green-400">Rs. {plan.dailyProfit}</span>
                  </div>
                  <div className="flex justify-between bg-gray-900 p-3 rounded-xl border border-gray-700">
                    <span className="text-gray-400 text-sm">Duration</span>
                    <span className="font-bold text-white">{plan.durationDays} Days</span>
                  </div>
                  <div className="flex justify-between bg-gray-900 p-3 rounded-xl border border-gray-700">
                    <span className="text-gray-400 text-sm">Total Return</span>
                    <span className="font-bold text-cyan-400">Rs. {(plan.dailyProfit * plan.durationDays)?.toLocaleString()}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Daily profit credited</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-400" /> Capital securely held</li>
                  <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-green-400" /> Instant activation</li>
                </ul>

                <button
                  onClick={() => handleInvest(plan)}
                  disabled={loadingId === plan.id || isActive || !canAfford}
                  className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                    isActive
                      ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                      : !canAfford
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : `bg-gradient-to-r ${color} hover:brightness-110 text-white shadow-lg`
                  }`}
                >
                  {loadingId === plan.id
                    ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : isActive
                      ? <><Activity className="w-4 h-4" /> Active</>
                      : !canAfford
                        ? <><Lock className="w-4 h-4" /> Insufficient Balance</>
                        : "Invest Now"
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* My investments */}
      {myInvestments.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
          <h3 className="font-bold text-white mb-4">My Investment History</h3>
          <div className="space-y-3">
            {myInvestments.map(inv => (
              <div key={inv.id} className="flex justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-700">
                <div>
                  <p className="font-bold text-white">{inv.planName}</p>
                  <p className="text-xs text-gray-400">Rs. {inv.amount} invested • Rs. {inv.dailyProfit}/day</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{inv.daysRemaining} days left</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border capitalize ${inv.status === "active" ? "text-green-400 bg-green-500/10 border-green-500/30" : "text-gray-400 bg-gray-700 border-gray-600"}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
