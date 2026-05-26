"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ArrowDownToLine, ArrowUpRight, Wallet, Activity, Filter } from "lucide-react";

export default function Transactions() {
  const { userData } = useStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, in, out

  const getMs = (timestamp) => {
    if (!timestamp) return 0;
    try {
      if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
        return timestamp.seconds * 1000;
      }
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().getTime();
      }
      if (timestamp instanceof Date) {
        return timestamp.getTime();
      }
      const parsed = new Date(timestamp).getTime();
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      return 0;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Processing...";
    try {
      if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
        const d = new Date(timestamp.seconds * 1000);
        if (!isNaN(d.getTime())) return d.toLocaleString();
      }
      if (typeof timestamp.toDate === 'function') {
        const d = timestamp.toDate();
        if (!isNaN(d.getTime())) return d.toLocaleString();
      }
      if (timestamp instanceof Date) {
        if (!isNaN(timestamp.getTime())) return timestamp.toLocaleString();
      }
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString();
      }
    } catch (e) {
      console.error("Error formatting timestamp:", e);
    }
    return "Processing...";
  };

  useEffect(() => {
    if (!userData?.id) return;
    const fetchTransactions = async () => {
      try {
        const uId = userData.id;
        
        // Fetch Deposits
        const depQ = query(collection(db, "deposits"), where("userId", "==", uId));
        const depSnap = await getDocs(depQ);
        const deposits = depSnap.docs.map(d => ({
          id: d.id,
          type: "deposit",
          title: "Deposit",
          amount: d.data().amount,
          status: d.data().status,
          timestamp: d.data().timestamp,
          method: d.data().method,
          isCredit: true
        }));

        // Fetch Withdrawals
        const wQ = query(collection(db, "withdrawals"), where("userId", "==", uId));
        const wSnap = await getDocs(wQ);
        const withdrawals = wSnap.docs.map(d => ({
          id: d.id,
          type: "withdrawal",
          title: "Withdrawal",
          amount: d.data().amount,
          status: d.data().status,
          timestamp: d.data().timestamp,
          method: d.data().method,
          isCredit: false
        }));

        // Fetch Investments
        const invQ = query(collection(db, "investments"), where("userId", "==", uId));
        const invSnap = await getDocs(invQ);
        const investments = invSnap.docs.map(d => ({
          id: d.id,
          type: "investment",
          title: `Purchased: ${d.data().planName}`,
          amount: d.data().amount,
          status: d.data().status === "active" ? "approved" : d.data().status,
          timestamp: d.data().startedAt,
          method: "Account Balance",
          isCredit: false
        }));

        // Combine and Sort safely using getMs
        let allTx = [...deposits, ...withdrawals, ...investments];
        allTx.sort((a, b) => getMs(b.timestamp) - getMs(a.timestamp));
        
        setTransactions(allTx);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [userData]);

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="animate-pulse h-24 bg-gray-800 rounded-3xl" />
      <div className="animate-pulse h-96 bg-gray-800 rounded-3xl" />
    </div>
  );

  const filteredTx = transactions.filter(t => {
    if (filter === "all") return true;
    if (filter === "in") return t.isCredit;
    if (filter === "out") return !t.isCredit;
    return true;
  });

  const getIcon = (type, isCredit) => {
    if (type === "deposit") return <ArrowDownToLine className="w-5 h-5 text-green-400" />;
    if (type === "withdrawal") return <ArrowUpRight className="w-5 h-5 text-red-400" />;
    if (type === "investment") return <Wallet className="w-5 h-5 text-purple-400" />;
    return <Activity className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Passbook</h1>
          <p className="text-gray-400 mt-1">Unified view of all your account transactions.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-xl border border-gray-700">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filter === "all" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter("in")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 ${filter === "in" ? "bg-green-500/20 text-green-400" : "text-gray-400 hover:text-white"}`}
          >
            <ArrowDownToLine className="w-4 h-4" /> In
          </button>
          <button 
            onClick={() => setFilter("out")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1 ${filter === "out" ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:text-white"}`}
          >
            <ArrowUpRight className="w-4 h-4" /> Out
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
        {filteredTx.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No transactions found for the selected filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {filteredTx.map((tx, idx) => (
              <div key={`${tx.id}-${idx}`} className="flex items-center justify-between p-4 md:p-6 hover:bg-gray-700/30 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                    tx.type === "deposit" ? "bg-green-500/10 border-green-500/20" : 
                    tx.type === "withdrawal" ? "bg-red-500/10 border-red-500/20" : 
                    "bg-purple-500/10 border-purple-500/20"
                  }`}>
                    {getIcon(tx.type, tx.isCredit)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base md:text-lg">{tx.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{formatTimestamp(tx.timestamp)}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs text-gray-400">{tx.method}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg md:text-xl font-extrabold ${tx.isCredit ? "text-green-400" : "text-white"}`}>
                    {tx.isCredit ? "+" : "-"}Rs. {tx.amount}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    tx.status === "approved" || tx.status === "completed" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                    tx.status === "pending" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
