"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import {
  collection, query, onSnapshot, doc, updateDoc, getDoc, deleteDoc, addDoc, serverTimestamp, orderBy, limit
} from "firebase/firestore";
import {
  Search, CheckCircle, XCircle, AlertTriangle, Image as ImageIcon, ShieldAlert,
  UserCheck, ShieldX, HelpCircle, Save, Info, ArrowDownToLine, MoreVertical
} from "lucide-react";

export default function DepositManagement() {
  const [deposits, setDeposits] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);
  
  // Admin action states
  const [activeNotesId, setActiveNotesId] = useState(null);
  const [adminNoteText, setAdminNoteText] = useState("");
  const [submittingNotes, setSubmittingNotes] = useState(false);

  useEffect(() => {
    const term = search.trim();
    let fallbackUnsub = null;

    const q = query(
      collection(db, "deposits"),
      orderBy("timestamp", "desc"),
      limit(term ? 300 : 150)
    );

    const unSub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Calculate duplicate TxIDs on the fly
      const tidCounts = {};
      data.forEach(d => { if (d.tid) tidCounts[d.tid] = (tidCounts[d.tid] || 0) + 1; });
      data.forEach(d => { d.isDuplicateTid = d.tid && tidCounts[d.tid] > 1; });
      
      setDeposits(data);
      setLoading(false);
    }, (err) => {
      console.warn("Deposits index query failed, using fallback:", err);
      const fallbackQuery = query(collection(db, "deposits"), limit(150));
      fallbackUnsub = onSnapshot(fallbackQuery, (fallbackSnap) => {
        const data = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sortedData = data.sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0));
        
        const tidCounts = {};
        sortedData.forEach(d => { if (d.tid) tidCounts[d.tid] = (tidCounts[d.tid] || 0) + 1; });
        sortedData.forEach(d => { d.isDuplicateTid = d.tid && tidCounts[d.tid] > 1; });
        
        setDeposits(sortedData);
        setLoading(false);
      }, (fallbackErr) => {
        console.error("Fallback deposits query failed:", fallbackErr);
        setLoading(false);
      });
    });

    return () => {
      unSub();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, [search]);

  const showMsg = (txt) => {
    alert(txt);
  };

  const handleApprove = async (dep) => {
    if(!window.confirm(`Approve Rs. ${dep.amount} for user ${dep.email}?`)) return;
    try {
      await updateDoc(doc(db, "deposits", dep.id), { 
        status: "approved",
        approvedAt: serverTimestamp()
      });
      
      const userRef = doc(db, "users", dep.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, { balance: (userSnap.data().balance || 0) + dep.amount });
      }

      // Add dynamic dashboard notification
      await addDoc(collection(db, `users/${dep.userId}/notifications`), {
        title: "💰 Deposit Approved",
        message: `Your deposit of Rs. ${dep.amount} via ${dep.method} has been approved. Your main balance was credited.`,
        read: false,
        timestamp: serverTimestamp()
      });

      // Referral bonus commission logic
      const referralSnap = await getDoc(doc(db, "referrals", dep.userId));
      if (referralSnap.exists()) {
        const { referrerId } = referralSnap.data();
        
        const genSnap = await getDoc(doc(db, "settings", "general"));
        const refPct = genSnap.exists() && genSnap.data().referralBonusPct ? genSnap.data().referralBonusPct : 10;
        
        const commission = Math.floor(dep.amount * (refPct / 100));
        const referrerRef = doc(db, "users", referrerId);
        const referrerSnap = await getDoc(referrerRef);
        if (referrerSnap.exists()) {
          await updateDoc(referrerRef, {
            referralEarnings: (referrerSnap.data().referralEarnings || 0) + commission,
            balance: (referrerSnap.data().balance || 0) + commission,
            activeReferralsCount: (referrerSnap.data().activeReferralsCount || 0) + 1
          });

          await addDoc(collection(db, `users/${referrerId}/notifications`), {
            title: "🎉 Referral Commission Received",
            message: `You earned Rs. ${commission} commission from your referred user's first deposit.`,
            read: false,
            timestamp: serverTimestamp()
          });

          await deleteDoc(doc(db, "referrals", dep.userId));
        }
      }
      showMsg("Deposit approved successfully.");
    } catch (err) { 
      console.error(err);
      showMsg("Error approving deposit."); 
    }
  };

  const handleReject = async (dep) => {
    if(!window.confirm(`Reject this deposit from ${dep.email}?`)) return;
    try {
      await updateDoc(doc(db, "deposits", dep.id), { status: "rejected" });
      
      await addDoc(collection(db, `users/${dep.userId}/notifications`), {
        title: "❌ Deposit Rejected",
        message: `Your deposit of Rs. ${dep.amount} was rejected. Please review transaction details or contact support.`,
        read: false,
        timestamp: serverTimestamp()
      });
      showMsg("Deposit rejected.");
    } catch {
      showMsg("Failed to reject deposit.");
    }
  };

  const handleMarkSuspicious = async (dep) => {
    if(!window.confirm(`Mark deposit from ${dep.email} as highly suspicious?`)) return;
    try {
      await updateDoc(doc(db, "deposits", dep.id), { status: "suspicious" });

      // Add to fraud logs
      await addDoc(collection(db, "fraud_logs"), {
        userId: dep.userId,
        email: dep.email,
        tid: dep.tid || "N/A",
        flagType: "Manual Admin Flag",
        riskScore: 90,
        riskLevel: "high",
        details: `Deposit reference manually marked suspicious by Admin. TID: ${dep.tid}`,
        timestamp: serverTimestamp()
      });

      // Submit user alert notification
      await addDoc(collection(db, `users/${dep.userId}/notifications`), {
        title: "⚠️ Security Hold: Deposit Marked Suspicious",
        message: `Your deposit of Rs. ${dep.amount} is currently on hold under administrative fraud reviews.`,
        read: false,
        timestamp: serverTimestamp()
      });

      showMsg("Deposit flagged as suspicious.");
    } catch {
      showMsg("Failed to flag deposit.");
    }
  };

  const handleBanUser = async (dep) => {
    if(!window.confirm(`Ban user ${dep.email} from the platform completely?`)) return;
    try {
      await updateDoc(doc(db, "users", dep.userId), { banned: true });
      await updateDoc(doc(db, "deposits", dep.id), { status: "rejected" });

      // Log admin ban action
      await addDoc(collection(db, "fraud_logs"), {
        userId: dep.userId,
        email: dep.email,
        flagType: "User Permanent Ban",
        riskScore: 100,
        riskLevel: "high",
        details: `User banned permanently by admin during deposit verification reviews. Email: ${dep.email}`,
        timestamp: serverTimestamp()
      });

      showMsg("User banned and request auto-rejected.");
    } catch {
      showMsg("Failed to ban user.");
    }
  };

  const handleOpenNotes = (dep) => {
    setActiveNotesId(dep.id);
    setAdminNoteText(dep.adminNote || "");
  };

  const handleSaveNotes = async (id) => {
    setSubmittingNotes(true);
    try {
      await updateDoc(doc(db, "deposits", id), {
        adminNote: adminNoteText
      });
      setActiveNotesId(null);
      showMsg("Admin note saved successfully!");
    } catch {
      showMsg("Failed to save note.");
    } finally {
      setSubmittingNotes(false);
    }
  };

  const filtered = deposits.filter(d => 
    (d.email || "").toLowerCase().includes(search.toLowerCase()) || 
    (d.tid || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.method || "").toLowerCase().includes(search.toLowerCase())
  );

  const getRiskStyles = (score) => {
    if (score >= 70) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (score >= 40) return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    return "text-green-400 bg-green-500/10 border-green-500/30";
  };

  const getStatusColor = (s) => {
    if (s === "approved") return "bg-green-500/20 text-green-400 border border-green-500/30";
    if (s === "rejected") return "bg-red-500/20 text-red-400 border border-red-500/30";
    if (s === "suspicious") return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl border border-gray-800" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="text-green-500 w-8 h-8" /> Manual Deposit Gateway Manager
          </h2>
          <p className="text-gray-400 text-sm mt-1">Review pending deposit payments, calculate user risk levels, and handle automated anti-fraud warnings.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search email, TID, method..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 pl-10 pr-4 py-3.5 rounded-xl text-white outline-none focus:border-green-500 transition text-sm font-semibold"
          />
        </div>
      </div>

      {/* Grid List for Deposits */}
      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-500">
          <ArrowDownToLine className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Deposit Requests Found</h3>
          <p className="text-sm">No transfer records matching your criteria were found in database logs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(d => (
            <div key={d.id} className="bg-gray-900/60 backdrop-blur border border-gray-800 rounded-3xl p-5 md:p-6 flex flex-col lg:flex-row justify-between gap-6 hover:border-gray-700 transition">
              {/* Left Column: User details, amounts */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusColor(d.status)}`}>
                    {d.status}
                  </span>
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${getRiskStyles(d.riskScore || 15)}`}>
                    Risk Score: {d.riskScore || 15}% ({(d.riskLevel || 'low').toUpperCase()} RISK)
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500">
                    {d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Depositor Account</p>
                    <p className="text-white font-bold mt-1 text-sm">{d.email}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">UID: {d.userId?.slice(0, 12)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Amount Sent</p>
                    <p className="text-green-400 font-extrabold text-xl mt-1">Rs. {d.amount}</p>
                    <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[10px] font-semibold">{d.method}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Transaction ID (TID)</p>
                    <p className="text-white font-mono font-bold mt-1 text-sm">{d.tid}</p>
                    {d.isDuplicateTid && (
                      <span className="inline-flex items-center gap-0.5 text-red-400 bg-red-950 px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 border border-red-900">
                        <AlertTriangle className="w-2.5 h-2.5" /> Duplicate ID!
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">KYC & Device</p>
                    <p className="text-gray-300 font-semibold mt-1 text-xs capitalize">KYC: {d.kycStatus || "unverified"}</p>
                    <p className="text-[9px] text-gray-600 truncate mt-0.5" title={d.deviceFingerprint}>{d.deviceFingerprint || "N/A"}</p>
                  </div>
                </div>

                {/* Risk analysis & fraud logs summary */}
                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-cyan-400" /> Administrative Threat Scorecard
                  </h4>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {d.isDuplicateTid ? (
                      <span className="text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 font-medium">⚠️ Fraud: Duplicate TID matched! Duplicate reference reuse.</span>
                    ) : (
                      <span className="text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 font-medium">✓ Transaction reference is unique</span>
                    )}

                    {d.kycStatus === 'verified' ? (
                      <span className="text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 font-medium">✓ Account holder verified (KYC Approved)</span>
                    ) : (
                      <span className="text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 font-medium">⚠️ Account holder has unverified KYC profile</span>
                    )}

                    {d.amount > 20000 ? (
                      <span className="text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 font-medium">⚠️ High value deposit require custom proof checking</span>
                    ) : (
                      <span className="text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 font-medium">✓ Standard deposit value limits</span>
                    )}
                  </div>
                </div>

                {/* Admin notes section */}
                <div className="flex items-center gap-3">
                  {activeNotesId === d.id ? (
                    <div className="flex gap-2 w-full max-w-md">
                      <input 
                        type="text" 
                        value={adminNoteText}
                        onChange={(e) => setAdminNoteText(e.target.value)}
                        placeholder="Add private note for logs..."
                        className="bg-gray-950 border border-gray-800 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-green-500 flex-1"
                      />
                      <button 
                        onClick={() => handleSaveNotes(d.id)}
                        disabled={submittingNotes}
                        className="bg-green-500 text-gray-900 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1 hover:brightness-110 transition"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button 
                        onClick={() => setActiveNotesId(null)}
                        className="bg-gray-800 text-white text-xs px-3 py-2 rounded-xl font-bold hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenNotes(d)}
                        className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                      >
                        {d.adminNote ? `✏️ Note: ${d.adminNote}` : "+ Add Admin Note"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Receipt preview & Actions */}
              <div className="flex lg:flex-col justify-between items-center lg:items-end gap-4 min-w-[200px] border-t lg:border-t-0 lg:border-l border-gray-800/80 pt-4 lg:pt-0 lg:pl-6">
                {d.screenshotUrl ? (
                  <button 
                    onClick={() => setPreviewImg(d.screenshotUrl)} 
                    className="group relative w-24 h-24 bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-cyan-500 transition shadow"
                  >
                    <img src={d.screenshotUrl} alt="Screenshot proof" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                  </button>
                ) : (
                  <div className="w-24 h-24 bg-gray-950 border border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-600 text-xs font-semibold">
                    No Receipt
                  </div>
                )}

                {/* Verification Actions */}
                {d.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleApprove(d)} 
                      className="bg-green-500 hover:brightness-110 text-gray-900 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition shadow shadow-green-500/20"
                      title="Approve and Credit Wallet"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleReject(d)} 
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 border border-red-500/20 transition"
                      title="Reject Deposit"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    {/* Flags */}
                    <div className="relative group">
                      <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-xl transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col bg-gray-950 border border-gray-800 rounded-2xl shadow-xl w-40 overflow-hidden z-20">
                        <button 
                          onClick={() => handleMarkSuspicious(d)} 
                          className="px-4 py-2.5 text-left text-[11px] text-orange-400 font-bold hover:bg-gray-900 flex items-center gap-1.5 transition"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Flag Suspicious
                        </button>
                        <button 
                          onClick={() => handleBanUser(d)} 
                          className="px-4 py-2.5 text-left text-[11px] text-red-500 font-bold hover:bg-gray-900 flex items-center gap-1.5 transition border-t border-gray-800"
                        >
                          <ShieldX className="w-3.5 h-3.5" /> Ban User account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot Overlay Modal */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="Deposit Proof reference" className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-gray-700 shadow-2xl p-1 bg-gray-900" />
          <button className="mt-4 bg-gray-800 text-white font-bold px-6 py-3 rounded-2xl hover:bg-gray-700 transition text-sm">
            Close Viewer
          </button>
        </div>
      )}
    </div>
  );
}
