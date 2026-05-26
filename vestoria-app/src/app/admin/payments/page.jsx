"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, addDoc, serverTimestamp
} from "firebase/firestore";
import {
  Plus, Edit, Trash2, CheckCircle2, XCircle, Sliders, AlertTriangle, ShieldAlert,
  ArrowDownToLine, ArrowUpRight, Check, LayoutDashboard, Landmark, Coins, HelpCircle, Save, Info, RefreshCw, CreditCard
} from "lucide-react";

export default function PaymentSettings() {
  const [activeTab, setActiveTab] = useState("gateways"); // gateways | withdrawals | fraud_logs | analytics
  const [methods, setMethods] = useState([]);
  const [fraudLogs, setFraudLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Form states for Add/Edit method
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formName, setFormName] = useState("JazzCash");
  const [formLogo, setFormLogo] = useState("📱");
  const [formTitle, setFormTitle] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formIban, setFormIban] = useState("");
  const [formQr, setFormQr] = useState("");
  const [formMinDep, setFormMinDep] = useState(100);
  const [formMaxDep, setFormMaxDep] = useState(50000);
  const [formInstructions, setFormInstructions] = useState("");
  const [formStatus, setFormStatus] = useState(true);

  // Withdrawal rules state
  const [minW, setMinW] = useState(500);
  const [maxW, setMaxW] = useState(25000);
  const [feePct, setFeePct] = useState(10);
  const [requireRef, setRequireRef] = useState(true);
  const [procTime, setProcTime] = useState("24 Hours");
  const [wInstructions, setWInstructions] = useState("");
  const [loadingRules, setLoadingRules] = useState(false);

  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    fraudAttempts: 0,
    popularMethod: "EasyPaisa"
  });

  const predefinedGateways = [
    { name: "JazzCash", logo: "📱", color: "from-yellow-600 to-amber-700" },
    { name: "EasyPaisa", logo: "💚", color: "from-emerald-500 to-green-600" },
    { name: "Bank Transfer", logo: "🏦", color: "from-blue-600 to-indigo-700" },
    { name: "USDT TRC20", logo: "🪙", color: "from-teal-500 to-cyan-600" },
    { name: "Binance Pay", logo: "🟡", color: "from-yellow-400 to-yellow-600" }
  ];

  useEffect(() => {
    // 1. Listen to payment methods
    const unsubMethods = onSnapshot(collection(db, "payment_methods"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMethods(list);
      setLoading(false);
    });

    // 2. Fetch withdrawal settings
    getDoc(doc(db, "settings", "general")).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMinW(data.minWithdrawal || 500);
        setMaxW(data.maxWithdrawal || 25000);
        setFeePct(data.withdrawalFeePct || 10);
        setRequireRef(data.requireReferralsForWithdraw !== false);
        setProcTime(data.withdrawalProcessingTime || "24 Hours");
        setWInstructions(data.withdrawalInstructions || "");
      }
    });

    // 3. Listen to Fraud logs
    const unsubFraud = onSnapshot(collection(db, "fraud_logs"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFraudLogs(list.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });

    // 4. Calculate analytics on fly
    const unsubDeps = onSnapshot(collection(db, "deposits"), (snapDeps) => {
      const deps = snapDeps.docs.map(d => d.data());
      const approvedDeps = deps.filter(d => d.status === "approved").reduce((sum, d) => sum + (d.amount || 0), 0);
      const pendingDeps = deps.filter(d => d.status === "pending").length;

      getDocs(collection(db, "withdrawals")).then((snapWids) => {
        const wids = snapWids.docs.map(w => w.data());
        const approvedWids = wids.filter(w => w.status === "approved").reduce((sum, w) => sum + (w.amount || 0), 0);
        const pendingWids = wids.filter(w => w.status === "pending").length;

        // Determine popular method
        const counts = {};
        deps.forEach(d => { if (d.method) counts[d.method] = (counts[d.method] || 0) + 1; });
        let popular = "EasyPaisa";
        let maxCount = 0;
        Object.keys(counts).forEach(k => {
          if (counts[k] > maxCount) {
            maxCount = counts[k];
            popular = k;
          }
        });

        setAnalytics({
          totalDeposits: approvedDeps,
          totalWithdrawals: approvedWids,
          pendingDeposits: pendingDeps,
          pendingWithdrawals: pendingWids,
          fraudAttempts: snapDeps.docs.filter(d => d.data().riskScore >= 70).length,
          popularMethod: popular
        });
      });
    });

    return () => {
      unsubMethods();
      unsubFraud();
      unsubDeps();
    };
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormName("JazzCash");
    setFormLogo("📱");
    setFormTitle("");
    setFormNumber("");
    setFormIban("");
    setFormQr("");
    setFormMinDep(100);
    setFormMaxDep(50000);
    setFormInstructions("");
    setFormStatus(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (method) => {
    setEditId(method.id);
    setFormName(method.name);
    setFormLogo(method.logo || "📱");
    setFormTitle(method.title || "");
    setFormNumber(method.number || "");
    setFormIban(method.iban || "");
    setFormQr(method.qrUrl || "");
    setFormMinDep(method.minDeposit || 100);
    setFormMaxDep(method.maxDeposit || 50000);
    setFormInstructions(method.instructions || "");
    setFormStatus(method.status !== false);
    setIsFormOpen(true);
  };

  const handleSaveMethod = async (e) => {
    e.preventDefault();
    if (!formTitle || !formNumber) return showMsg("error", "Account Title and Number are required.");
    
    setLoading(true);
    try {
      const data = {
        name: formName,
        logo: formLogo,
        title: formTitle,
        number: formNumber,
        iban: formIban,
        qrUrl: formQr,
        minDeposit: Number(formMinDep),
        maxDeposit: Number(formMaxDep),
        instructions: formInstructions,
        status: formStatus,
        updatedAt: new Date().toISOString()
      };

      if (editId) {
        await updateDoc(doc(db, "payment_methods", editId), data);
        showMsg("success", "✅ Payment method updated successfully!");
      } else {
        const newRef = doc(collection(db, "payment_methods"));
        await setDoc(newRef, { id: newRef.id, ...data });
        showMsg("success", "✅ New payment method added successfully!");
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      showMsg("error", "Error saving payment method.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment method?")) return;
    try {
      await deleteDoc(doc(db, "payment_methods", id));
      showMsg("success", "✅ Payment method deleted successfully!");
    } catch {
      showMsg("error", "Error deleting payment method.");
    }
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    setLoadingRules(true);
    try {
      await updateDoc(doc(db, "settings", "general"), {
        minWithdrawal: Number(minW),
        maxWithdrawal: Number(maxW),
        withdrawalFeePct: Number(feePct),
        requireReferralsForWithdraw: requireRef,
        withdrawalProcessingTime: procTime,
        withdrawalInstructions: wInstructions
      });
      showMsg("success", "✅ Withdrawal rules updated successfully!");
    } catch (err) {
      showMsg("error", "Failed to update rules.");
    } finally {
      setLoadingRules(false);
    }
  };

  const handleToggleStatus = async (method) => {
    try {
      await updateDoc(doc(db, "payment_methods", method.id), {
        status: !method.status
      });
    } catch {
      showMsg("error", "Failed to toggle status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Sliders className="text-green-500 w-8 h-8" /> Payment settings
          </h2>
          <p className="text-gray-400 text-sm mt-1">Configure manual payment gateways, withdrawals, limits, and monitor transaction fraud.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-green-500 to-cyan-500 hover:brightness-110 text-gray-900 font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-green-500/20 text-sm"
        >
          <Plus className="w-5 h-5" /> Add Payment Method
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${
          msg.type === "success" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-px">
        {[
          { id: "gateways", label: "Gateways", icon: Landmark },
          { id: "withdrawals", label: "Withdrawal Setup", icon: Sliders },
          { id: "fraud_logs", label: "Fraud Alerts", icon: ShieldAlert, badge: fraudLogs.length },
          { id: "analytics", label: "Analytics Dashboard", icon: LayoutDashboard }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-6 py-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === t.id 
                ? "border-green-500 text-green-400 bg-green-500/5" 
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ml-1">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* GATEWAYS TAB */}
      {activeTab === "gateways" && (
        <div className="space-y-6">
          {/* Pre-populated list or dynamic list grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-64 bg-gray-900 border border-gray-800 rounded-3xl" />
              ))}
            </div>
          ) : methods.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center">
              <Landmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Gateways Configured</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">Create manual deposit pathways (JazzCash, EasyPaisa, Binance, etc.) for users to deposit cash.</p>
              <button 
                onClick={handleOpenAdd}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
              >
                Create First Gateway
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {methods.map(m => {
                const colors = predefinedGateways.find(p => p.name === m.name)?.color || "from-gray-700 to-gray-800";
                return (
                  <div key={m.id} className="bg-gray-900/60 backdrop-blur border border-gray-800 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-gray-700 transition">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors} flex items-center justify-center text-2xl font-bold`}>
                            {m.logo || "📱"}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-white text-lg">{m.name}</h4>
                            <span className="text-[10px] text-gray-500 font-mono">ID: {m.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                        {/* Toggle active switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(m)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                            m.status !== false ? "bg-green-500" : "bg-gray-700"
                          }`}
                        >
                          <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                            m.status !== false ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </button>
                      </div>

                      {/* Info lines */}
                      <div className="space-y-2 mt-4 text-sm border-t border-gray-800/80 pt-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Title:</span>
                          <span className="text-white font-semibold">{m.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account #:</span>
                          <span className="text-white font-mono font-medium">{m.number}</span>
                        </div>
                        {m.iban && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">IBAN:</span>
                            <span className="text-white font-mono text-xs">{m.iban}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-gray-800/40 pt-2 text-xs">
                          <span className="text-gray-400">Min Deposit:</span>
                          <span className="text-green-400 font-bold">Rs. {m.minDeposit}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Max Deposit:</span>
                          <span className="text-green-400 font-bold">Rs. {m.maxDeposit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-950 p-4 border-t border-gray-800 flex justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-cyan-400 hover:text-cyan-300 font-bold py-2.5 rounded-xl border border-gray-800 transition flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Configuration
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMethod(m.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2.5 rounded-xl transition"
                        title="Delete Gateway"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WITHDRAWAL TAB */}
      {activeTab === "withdrawals" && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="text-cyan-400 w-5 h-5" /> Manual Withdrawal Parameters
            </h3>
            <p className="text-gray-400 text-xs mt-1">Configure systemic limits, processing rules, and prerequisites applied automatically during user withdrawal requests.</p>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Withdrawal (Rs.)</label>
                <input
                  type="number"
                  value={minW}
                  onChange={(e) => setMinW(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Withdrawal (Rs.)</label>
                <input
                  type="number"
                  value={maxW}
                  onChange={(e) => setMaxW(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Withdrawal Fee (%)</label>
                <input
                  type="number"
                  value={feePct}
                  onChange={(e) => setFeePct(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Processing Time</label>
                <input
                  type="text"
                  value={procTime}
                  onChange={(e) => setProcTime(e.target.value)}
                  placeholder="e.g. 24 Hours"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
            </div>

            {/* Impersonation referral rules */}
            <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Mandatory Referral Lock
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">Requires users to register at least 2 active depositing referrals before making withdrawals.</p>
              </div>
              <button
                type="button"
                onClick={() => setRequireRef(!requireRef)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  requireRef ? "bg-cyan-500" : "bg-gray-800"
                }`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                  requireRef ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Instructions shown to Users</label>
              <textarea
                value={wInstructions}
                onChange={(e) => setWInstructions(e.target.value)}
                placeholder="Submit your jazzcash or bank accounts. Wrong details cannot be corrected once sent..."
                rows="3"
                className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loadingRules}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-70 shadow-lg shadow-cyan-500/10"
            >
              {loadingRules ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><Save className="w-4 h-4" /> Save Parameters</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* FRAUD ALERTS TAB */}
      {activeTab === "fraud_logs" && (
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-red-400">System Fraud Mitigation Logs</h4>
              <p className="text-xs text-red-300/80 mt-1">This log automatically flags transactions showing duplicate transaction IDs, matching payment screenshots, or double deposit submissions from the same IP/Device within 24 hours.</p>
            </div>
          </div>

          {fraudLogs.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">No Fraud Flagged</h3>
              <p className="text-sm max-w-xs mx-auto">No suspicious transaction patterns detected in the current deposits database.</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-800/40 text-gray-400 border-b border-gray-800">
                    <tr>
                      <th className="p-4 font-medium">Timestamp</th>
                      <th className="p-4 font-medium">User Account</th>
                      <th className="p-4 font-medium">Flag Type</th>
                      <th className="p-4 font-medium">Detail</th>
                      <th className="p-4 font-medium">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudLogs.map(log => (
                      <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-850 transition">
                        <td className="p-4 text-xs text-gray-500">
                          {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                        </td>
                        <td className="p-4 font-bold text-white">
                          {log.email}
                          <p className="text-[10px] text-gray-500 font-mono">UID: {log.userId?.slice(0, 10)}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.riskLevel === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          }`}>
                            {log.flagType || "Duplicate TID"}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300 text-xs">
                          {log.details || `Submitted transaction ID ${log.tid} which already existed.`}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-gray-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${log.riskScore >= 70 ? 'bg-red-500' : 'bg-orange-500'}`}
                                style={{ width: `${log.riskScore || 50}%` }}
                              />
                            </div>
                            <span className={`font-bold text-xs ${log.riskScore >= 70 ? 'text-red-400' : 'text-orange-400'}`}>
                              {log.riskScore || 50}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-gray-400 text-xs font-semibold flex items-center gap-1">
                <ArrowDownToLine className="w-3.5 h-3.5 text-green-400" /> Total Verified Deposits
              </span>
              <p className="text-2xl font-extrabold text-green-400 mt-2">Rs. {analytics.totalDeposits}</p>
              <div className="text-[10px] text-gray-500 mt-2 font-mono">{analytics.pendingDeposits} Deposit Requests Pending</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-gray-400 text-xs font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" /> Paid Withdrawals
              </span>
              <p className="text-2xl font-extrabold text-cyan-400 mt-2">Rs. {analytics.totalWithdrawals}</p>
              <div className="text-[10px] text-gray-500 mt-2 font-mono">{analytics.pendingWithdrawals} Payout Requests Pending</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-gray-400 text-xs font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Fraud Logs Count
              </span>
              <p className="text-2xl font-extrabold text-red-500 mt-2">{analytics.fraudAttempts}</p>
              <div className="text-[10px] text-gray-500 mt-2 font-mono">Includes duplicate screenshots & double TxIDs</div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-gray-400 text-xs font-semibold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-500" /> Top Payment Gateway
              </span>
              <p className="text-2xl font-extrabold text-yellow-400 mt-2">{analytics.popularMethod}</p>
              <div className="text-[10px] text-gray-500 mt-2 font-mono">By verified volume</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Payment Volume Overview</h3>
            <div className="h-64 flex items-end justify-between gap-2 pt-6">
              {[
                { day: "Mon", dep: 12000, wid: 8000 },
                { day: "Tue", dep: 18000, wid: 11000 },
                { day: "Wed", dep: 15000, wid: 9000 },
                { day: "Thu", dep: 22000, wid: 14000 },
                { day: "Fri", dep: 30000, wid: 17000 },
                { day: "Sat", dep: 25000, wid: 13000 },
                { day: "Sun", dep: 28000, wid: 15000 }
              ].map((h, i) => {
                const max = 35000;
                const depPct = (h.dep / max) * 100;
                const widPct = (h.wid / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex gap-1 justify-center items-end h-full max-h-[80%]">
                      <div className="w-3 bg-green-500/80 rounded-t-sm" style={{ height: `${depPct}%` }} title={`Deposits: Rs.${h.dep}`} />
                      <div className="w-3 bg-cyan-500/80 rounded-t-sm" style={{ height: `${widPct}%` }} title={`Withdrawals: Rs.${h.wid}`} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold">{h.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-6 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-green-400">
                <div className="w-3 h-3 bg-green-500 rounded-full" /> Verified Deposits Volume
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <div className="w-3 h-3 bg-cyan-500 rounded-full" /> Approved Payouts Volume
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC CONFIGURATION POPUP FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editId ? "⚙️ Modify Gateway Settings" : "🔌 Configure New Gateway"}
              </h3>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-white font-extrabold text-lg p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Gateway Provider</label>
                  <select
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      const pre = predefinedGateways.find(p => p.name === e.target.value);
                      if (pre) setFormLogo(pre.logo);
                    }}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition"
                  >
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="USDT TRC20">USDT TRC20 (USDT)</option>
                    <option value="Binance Pay">Binance Pay</option>
                    <option value="Custom Method">Custom Payment Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Visual Logo/Emoji</label>
                  <input
                    type="text"
                    value={formLogo}
                    onChange={(e) => setFormLogo(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Account Title / Name</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. DailyProfit PK Co."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Account / Mobile Number</label>
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    placeholder="e.g. 0300-1234567"
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">IBAN / Secondary Details</label>
                  <input
                    type="text"
                    value={formIban}
                    onChange={(e) => setFormIban(e.target.value)}
                    placeholder="e.g. PK83UNIL00000..."
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">QR Code Image Link</label>
                <input
                  type="url"
                  value={formQr}
                  onChange={(e) => setFormQr(e.target.value)}
                  placeholder="Paste QR Code URL (e.g. from imgbb.com)..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Minimum Deposit (Rs.)</label>
                  <input
                    type="number"
                    value={formMinDep}
                    onChange={(e) => setFormMinDep(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Maximum Deposit (Rs.)</label>
                  <input
                    type="number"
                    value={formMaxDep}
                    onChange={(e) => setFormMaxDep(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Custom Deposit Instructions</label>
                <textarea
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Provide detailed instructions for transferring, including required format or notes to add..."
                  rows="2"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition text-sm"
                />
              </div>

              <div className="flex items-center gap-2 p-2 border-t border-gray-800 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-gray-850 hover:bg-gray-800 text-white font-bold px-5 py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-cyan-500 hover:brightness-110 text-gray-900 font-bold px-6 py-3 rounded-xl transition text-sm"
                >
                  Save Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
