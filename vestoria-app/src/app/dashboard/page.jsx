"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, orderBy, limit, doc, onSnapshot } from "firebase/firestore";
import { TrendingUp, Wallet, Activity, Users, ArrowUpRight, ArrowDownToLine, CreditCard, Bell, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function DashboardHome() {
  const { userData } = useStore();
  const [investments, setInvestments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [profitHistory, setProfitHistory] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [notices, setNotices] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
   const [loading, setLoading] = useState(true);
  const [generalSettings, setGeneralSettings] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (snap) => {
      if (snap.exists()) setGeneralSettings(snap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userData?.id) return;

    const fetchAll = async () => {
      try {
        // Fetch all snapshots in parallel
        const [invSnap, depSnap, widSnap, noticeSnap, bannerSnap] = await Promise.all([
          getDocs(query(collection(db, "investments"), where("userId", "==", userData.id))),
          getDocs(query(collection(db, "deposits"), where("userId", "==", userData.id))),
          getDocs(query(collection(db, "withdrawals"), where("userId", "==", userData.id))),
          getDocs(query(collection(db, "notices"), where("active", "==", true))),
          getDocs(collection(db, "banners"))
        ]);

        // Investments
        const invData = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        invData.sort((a, b) => (b.startedAt?.seconds || 0) - (a.startedAt?.seconds || 0));
        setInvestments(invData);

        // Deposits
        const depData = depSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        depData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setDeposits(depData);

        // Withdrawals
        const widData = widSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setWithdrawals(widData);

        // Notices
        const noticeData = noticeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        noticeData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setNotices(noticeData);

        // Banners
        const bannerData = bannerSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        bannerData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setBanners(bannerData);

        // Build 7-day profit history from active investments
        const activeInv = invData.filter(i => i.status === "active");
        const totalDaily = activeInv.reduce((sum, i) => sum + (i.dailyProfit || 0), 0);
        const profit = userData?.profit || 0;
        const history = Array.from({ length: 7 }, (_, i) => {
          const dayFraction = (i + 1) / 7;
          return Math.max(0, Math.round(profit * dayFraction));
        });
        setProfitHistory(history);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userData]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const totalInvested = investments.filter(i => i.status === "active").reduce((s, i) => s + (i.amount || 0), 0);
  const totalDeposited = deposits.filter(d => d.status === "approved").reduce((s, d) => s + (d.amount || 0), 0);
  const dailyEarning = investments.filter(i => i.status === "active").reduce((s, i) => s + (i.dailyProfit || 0), 0);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280", font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { color: "#6b7280", font: { size: 11 } } }
    }
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getTypeStyle = (type) => {
    if (type === 'success') return "text-green-400 bg-green-500/10 border-green-500/30";
    if (type === 'warning') return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    if (type === 'danger') return "text-red-400 bg-red-500/10 border-red-500/30";
    return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  };

  const getTypeIcon = (type) => {
    if (type === 'success') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    if (type === 'danger') return <AlertTriangle className="w-5 h-5 text-red-400" />;
    return <Info className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Global Announcement Scrolling Marquee */}
      {generalSettings?.announcementNotice && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-500/20 rounded-2xl p-3 flex items-center gap-3 overflow-hidden shadow">
          <div className="flex-shrink-0 bg-blue-500 text-gray-950 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> Live Announcement
          </div>
          <marquee className="text-xs font-bold text-gray-300 tracking-wide">
            {generalSettings.announcementNotice}
          </marquee>
        </div>
      )}

      {/* Global Notices */}
      {notices.map(n => (
        <div key={n.id} className={`border rounded-2xl p-4 flex items-start gap-4 ${getTypeStyle(n.type)}`}>
          <div className="mt-0.5">{getTypeIcon(n.type)}</div>
          <div>
            <h3 className="font-bold text-[15px]">{n.title}</h3>
            <p className="text-sm opacity-90 mt-1">{n.message}</p>
          </div>
        </div>
      ))}

      {/* Promotional Banners Slider */}
      {banners.length > 0 && (
        <div className="relative w-full rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[21/6] border border-gray-700 shadow-xl group">
          {banners.map((b, idx) => (
            <a 
              key={b.id} 
              href={b.targetUrl || "#"} 
              target={b.targetUrl ? "_blank" : "_self"} 
              rel="noreferrer"
              className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <img src={b.imageUrl} alt="Promo" className="w-full h-full object-cover" />
            </a>
          ))}
          {/* Slider Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {banners.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCurrentBanner(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentBanner ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Good day,</p>
          <h2 className="text-2xl font-extrabold text-white">{userData?.name || "Investor"} 👋</h2>
          <p className="text-gray-400 text-sm mt-1">Here's your portfolio overview.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-xl">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm font-bold">Account Active</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Main Balance", value: `Rs. ${(userData?.balance || 0).toLocaleString()}`, color: "text-green-400", bg: "from-green-500/10 to-green-500/5", border: "border-green-500/20", icon: Wallet },
          { label: "Profit Wallet", value: `Rs. ${(userData?.profit || 0).toLocaleString()}`, color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-500/5", border: "border-cyan-500/20", icon: TrendingUp },
          { label: "Daily Earning", value: `Rs. ${dailyEarning.toLocaleString()}`, color: "text-purple-400", bg: "from-purple-500/10 to-purple-500/5", border: "border-purple-500/20", icon: ArrowUpRight },
          { label: "Referral Earned", value: `Rs. ${(userData?.referralEarnings || 0).toLocaleString()}`, color: "text-orange-400", bg: "from-orange-500/10 to-orange-500/5", border: "border-orange-500/20", icon: Users },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.bg} border ${stat.border} p-4 md:p-5 rounded-2xl relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-3">
              <p className="text-gray-400 text-xs font-medium">{stat.label}</p>
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-60`} />
            </div>
            <p className={`text-xl md:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profit line chart */}
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" /> Profit Growth
            </h3>
            <span className="text-xs text-gray-400">7 Days</span>
          </div>
          <div className="h-48">
            <Line
              data={{
                labels: days,
                datasets: [{
                  data: profitHistory,
                  borderColor: "#22d3ee",
                  backgroundColor: "rgba(34,211,238,0.15)",
                  borderWidth: 2,
                  tension: 0.4,
                  fill: true,
                  pointBackgroundColor: "#22d3ee",
                  pointRadius: 4,
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Deposits Bar chart */}
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-green-400" /> Deposit History
            </h3>
            <span className="text-xs text-gray-400">Last 7</span>
          </div>
          <div className="h-48">
            <Bar
              data={{
                labels: deposits.slice(0, 7).map((_, i) => `#${i + 1}`).reverse(),
                datasets: [{
                  data: deposits.slice(0, 7).map(d => d.amount).reverse(),
                  backgroundColor: deposits.slice(0, 7).map(d =>
                    d.status === "approved" ? "rgba(34,197,94,0.7)"
                    : d.status === "rejected" ? "rgba(239,68,68,0.7)"
                    : "rgba(234,179,8,0.7)"
                  ).reverse(),
                  borderRadius: 6,
                }]
              }}
              options={{ ...chartOptions, plugins: { ...chartOptions.plugins, tooltip: { callbacks: { label: (ctx) => `Rs. ${ctx.raw}` } } } }}
            />
          </div>
        </div>
      </div>

      {/* Active Investments */}
      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" /> Active Investments
          {investments.filter(i => i.status === "active").length > 0 && (
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
              {investments.filter(i => i.status === "active").length} Active
            </span>
          )}
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-gray-700 rounded-xl animate-pulse" />)}
          </div>
        ) : investments.filter(i => i.status === "active").length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No active investments. <a href="/dashboard/investments" className="text-cyan-400 hover:underline">Browse Plans →</a></p>
          </div>
        ) : (
          <div className="space-y-3">
            {investments.filter(i => i.status === "active").map(inv => (
              <div key={inv.id} className="flex justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-700">
                <div>
                  <p className="font-bold text-white">{inv.planName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Rs. {inv.amount?.toLocaleString()} invested • {inv.daysRemaining} days left</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-green-400">+Rs. {inv.dailyProfit}/day</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total: Rs. {(inv.dailyProfit * inv.durationDays)?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" /> Recent Transactions
          </h3>
          <a href="/dashboard/transactions" className="text-xs text-cyan-400 hover:underline">View All →</a>
        </div>
        {deposits.length === 0 && withdrawals.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {[...deposits.slice(0, 3).map(d => ({ ...d, type: "deposit" })),
              ...withdrawals.slice(0, 2).map(w => ({ ...w, type: "withdrawal" }))]
              .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
              .slice(0, 5)
              .map((tx, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-gray-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === "deposit" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                      {tx.type === "deposit"
                        ? <ArrowDownToLine className="w-4 h-4 text-green-400" />
                        : <CreditCard className="w-4 h-4 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                      <p className="text-xs text-gray-500">{tx.method || "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${tx.type === "deposit" ? "text-green-400" : "text-red-400"}`}>
                      {tx.type === "deposit" ? "+" : "-"}Rs. {tx.amount?.toLocaleString()}
                    </p>
                    <span className={`text-[10px] font-bold capitalize ${tx.status === "approved" ? "text-green-400" : tx.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>
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
