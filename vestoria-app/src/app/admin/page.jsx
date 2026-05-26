"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, where, getDocs } from "firebase/firestore";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Users, ArrowDownToLine, CreditCard, Activity, TrendingUp, Zap } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const Line = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), { ssr: false });

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, deposits: 0, withdrawals: 0, activeInv: 0 });
  const [activities, setActivities] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], deposits: [], withdrawals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Users
    const unSubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setStats(s => ({ ...s, users: snap.size }));
    });

    // 2. Fetch Deposits
    const unSubDeps = onSnapshot(collection(db, "deposits"), (snap) => {
      const deps = snap.docs.map(d => d.data());
      const total = deps.filter(d => d.status === "approved").reduce((sum, d) => sum + d.amount, 0);
      setStats(s => ({ ...s, deposits: total }));
      
      // Build activity feed
      const recentDeps = deps.map(d => ({ type: "deposit", ...d })).sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0)).slice(0, 5);
      
      // Chart Data Building (last 7 items for simplicity)
      const labels = deps.slice(0, 7).map((_, i) => `D-${i+1}`);
      const depData = deps.slice(0, 7).map(d => d.amount);
      setChartData(prev => ({ ...prev, labels, deposits: depData }));
      
      updateActivities("deposit", recentDeps);
    });

    // 3. Fetch Withdrawals
    const unSubWids = onSnapshot(collection(db, "withdrawals"), (snap) => {
      const wids = snap.docs.map(d => d.data());
      const total = wids.filter(d => d.status === "approved").reduce((sum, d) => sum + d.amount, 0);
      setStats(s => ({ ...s, withdrawals: total }));
      
      const recentWids = wids.map(w => ({ type: "withdrawal", ...w })).sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0)).slice(0, 5);
      const widData = wids.slice(0, 7).map(w => w.amount);
      setChartData(prev => ({ ...prev, withdrawals: widData }));
      
      updateActivities("withdrawal", recentWids);
    });

    // 4. Fetch Active Investments
    const unSubInv = onSnapshot(query(collection(db, "investments"), where("status", "==", "active")), (snap) => {
      setStats(s => ({ ...s, activeInv: snap.size }));
      setLoading(false);
    });

    return () => { unSubUsers(); unSubDeps(); unSubWids(); unSubInv(); };
  }, []);

  const updateActivities = (type, data) => {
    setActivities(prev => {
      const filtered = prev.filter(p => p.type !== type);
      return [...filtered, ...data].sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0)).slice(0, 10);
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280" } },
      x: { grid: { display: false }, ticks: { color: "#6b7280" } }
    }
  };

  if (loading) return <div className="animate-pulse flex gap-4"><div className="w-full h-32 bg-gray-800 rounded-xl"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          <p className="text-gray-400 text-sm">Real-time platform statistics and activity.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-400", bg: "from-blue-500/10 to-transparent", border: "border-blue-500/20" },
          { label: "Total Deposits", value: `Rs. ${stats.deposits.toLocaleString()}`, icon: ArrowDownToLine, color: "text-green-400", bg: "from-green-500/10 to-transparent", border: "border-green-500/20" },
          { label: "Total Withdrawals", value: `Rs. ${stats.withdrawals.toLocaleString()}`, icon: CreditCard, color: "text-cyan-400", bg: "from-cyan-500/10 to-transparent", border: "border-cyan-500/20" },
          { label: "Active Investments", value: stats.activeInv, icon: Activity, color: "text-purple-400", bg: "from-purple-500/10 to-transparent", border: "border-purple-500/20" },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.bg} border ${stat.border} p-6 rounded-2xl`}>
            <div className="flex justify-between items-start mb-4">
              <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-80`} />
            </div>
            <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Analytics Charts */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400"/> Financial Overview</h3>
            <div className="h-72">
              <Line 
                data={{
                  labels: chartData.labels.length > 0 ? chartData.labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                  datasets: [
                    {
                      label: "Deposits",
                      data: chartData.deposits.length > 0 ? chartData.deposits : [0,0,0,0,0,0,0],
                      borderColor: "#00FF99",
                      backgroundColor: "rgba(0, 255, 153, 0.1)",
                      borderWidth: 2, tension: 0.4, fill: true,
                    },
                    {
                      label: "Withdrawals",
                      data: chartData.withdrawals.length > 0 ? chartData.withdrawals : [0,0,0,0,0,0,0],
                      borderColor: "#22d3ee",
                      backgroundColor: "transparent",
                      borderWidth: 2, tension: 0.4,
                    }
                  ]
                }} 
                options={chartOptions} 
              />
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl flex flex-col">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Live Activity Feed
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">No recent activity</p>
            ) : (
              activities.map((act, i) => (
                <div key={i} className="flex gap-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${act.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                    {act.type === 'deposit' ? <ArrowDownToLine className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      <span className="capitalize">{act.type}</span> of Rs. {act.amount}
                    </p>
                    <p className="text-xs text-gray-400 truncate w-48">{act.email}</p>
                    <p className="text-[10px] font-bold mt-1 uppercase text-gray-500">{act.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
