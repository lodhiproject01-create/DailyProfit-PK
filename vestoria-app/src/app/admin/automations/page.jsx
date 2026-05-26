"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { Zap, Play, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function Automations() {
  const [activeInvestments, setActiveInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "investments"), where("status", "==", "active"));
      const snap = await getDocs(q);
      setActiveInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const runDistribution = async () => {
    if (activeInvestments.length === 0) {
      setMsg({ type: "warning", text: "No active investments to distribute to." });
      return;
    }

    const confirm = window.confirm(`Are you sure you want to run the Daily ROI Distribution?\n\nThis will credit profits to ${activeInvestments.length} active investments.`);
    if (!confirm) return;

    setRunning(true);
    setMsg(null);
    try {
      // We will do this in chunks if there are many, but for now we assume < 500
      const batch = writeBatch(db);
      let totalDistributed = 0;

      // Group investments by userId to update user balances correctly if a user has multiple investments
      const userUpdates = {};

      for (const inv of activeInvestments) {
        if (inv.daysRemaining > 0) {
          const newDays = inv.daysRemaining - 1;
          const invRef = doc(db, "investments", inv.id);
          
          batch.update(invRef, {
            daysRemaining: newDays,
            status: newDays === 0 ? "completed" : "active",
            lastDistributed: new Date().toISOString()
          });

          if (!userUpdates[inv.userId]) {
            userUpdates[inv.userId] = 0;
          }
          userUpdates[inv.userId] += inv.dailyProfit;
          totalDistributed += inv.dailyProfit;
        }
      }

      // We need to get current user balances to add to them.
      // Firebase batch doesn't support increment without getting the doc first unless we use FieldValue.increment
      // Let's use FieldValue.increment! Wait, I can't import FieldValue easily from firebase/firestore in next.js client sometimes without namespace issues. 
      // Actually `increment` function is available in firebase/firestore!
      // But let's just fetch them to be safe, or import increment.
      
      const { increment } = await import("firebase/firestore");

      for (const [userId, profitAmount] of Object.entries(userUpdates)) {
        const userRef = doc(db, "users", userId);
        batch.update(userRef, {
          balance: increment(profitAmount),
          profit: increment(profitAmount)
        });
      }

      await batch.commit();

      setMsg({ type: "success", text: `✅ Successfully distributed Rs. ${totalDistributed.toLocaleString()} across ${activeInvestments.length} investments!` });
      fetchInvestments(); // Refresh

    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: err.message });
    } finally {
      setRunning(false);
    }
  };

  const totalDailyProfit = activeInvestments.reduce((sum, inv) => sum + (inv.dailyProfit || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-400" />
            System Automations
          </h1>
          <p className="text-gray-400 mt-1">Run critical system tasks manually if cron jobs are not configured.</p>
        </div>
        <button 
          onClick={fetchInvestments}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition bg-gray-800 px-4 py-2 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Stats
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          msg.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" :
          msg.type === "warning" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
          "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <p className="font-medium text-sm">{msg.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Daily Profit Distribution Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500" />
          
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition">
            <Zap className="w-10 h-10 text-yellow-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Daily ROI Distribution</h2>
          <p className="text-gray-400 text-sm mb-8">
            This task calculates and distributes the daily profit for all active investments. 
            It adds the profit to users' Main Balance and reduces their investment duration by 1 day.
          </p>

          <div className="w-full bg-gray-900 rounded-2xl p-4 mb-8 flex justify-between items-center border border-gray-700">
            <div className="text-left">
              <p className="text-xs text-gray-500 font-bold uppercase">Active Investments</p>
              <p className="text-2xl font-extrabold text-white">{activeInvestments.length}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-bold uppercase">Total Payout Today</p>
              <p className="text-2xl font-extrabold text-yellow-400">Rs. {totalDailyProfit.toLocaleString()}</p>
            </div>
          </div>

          <button
            onClick={runDistribution}
            disabled={running || loading}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:brightness-110 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
          >
            {running ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
                Processing Payouts...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" /> Execute Daily Distribution
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
