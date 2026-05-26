"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import {
  collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, onSnapshot
} from "firebase/firestore";
import { Landmark, ArrowRight, Clock, AlertTriangle, Coins, ShieldCheck } from "lucide-react";

export default function Withdraw() {
  const { userData } = useStore();
  const [amount, setAmount] = useState("");
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState(null);

  // Settings configs
  const [minW, setMinW] = useState(500);
  const [maxW, setMaxW] = useState(25000);
  const [feePct, setFeePct] = useState(10);
  const [requireRef, setRequireRef] = useState(true);
  const [procTime, setProcTime] = useState("24 Hours");
  const [wInstructions, setWInstructions] = useState("");

  // Load payment methods dynamically from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payment_methods"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.status !== false);
      if (list.length === 0) {
        const fallbacks = [
          { id: "jazz", name: "JazzCash", logo: "📱" },
          { id: "ep", name: "EasyPaisa", logo: "💚" },
          { id: "bank", name: "Bank Transfer", logo: "🏦" }
        ];
        setMethods(fallbacks);
        setSelectedMethod(fallbacks[0]);
      } else {
        setMethods(list);
        setSelectedMethod(list[0]);
      }
    });

    return () => unsub();
  }, []);

  // Fetch withdrawal parameters and user payout history
  useEffect(() => {
    if (!userData?.id) return;

    const unsubHistory = onSnapshot(
      query(collection(db, "withdrawals"), where("userId", "==", userData.id)),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setHistory(data);
      }
    );

    // Fetch dynamic parameters
    const unsubParams = onSnapshot(doc(db, "settings", "general"), (snap) => {
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

    return () => {
      unsubHistory();
      unsubParams();
    };
  }, [userData]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!userData || !selectedMethod) return;

    const wAmount = Number(amount);
    if (wAmount < minW) return setMsg({ type: "error", text: `Minimum withdrawal is Rs. ${minW}` });
    if (wAmount > maxW) return setMsg({ type: "error", text: `Maximum single withdrawal limit is Rs. ${maxW}` });
    if (wAmount > (userData.profit || 0)) {
      return setMsg({ type: "error", text: "Insufficient profit balance. Payouts are drawn exclusively from your profit wallet." });
    }
    
    if (requireRef && (userData.activeReferralsCount || 0) < 2) {
      return setMsg({ type: "error", text: `Withdrawal locked. 2 active referrals needed to unlock payouts. Current active refs: ${userData.activeReferralsCount || 0}.` });
    }

    setLoading(true);
    try {
      const feeAmount = Math.floor(wAmount * (feePct / 100));
      const finalAmount = wAmount - feeAmount;

      await addDoc(collection(db, "withdrawals"), {
        userId: userData.id,
        email: userData.email,
        name: userData.name,
        amount: wAmount,
        feeAmount: feeAmount,
        finalAmount: finalAmount,
        method: selectedMethod.name,
        accountTitle: accountName,
        accountNumber,
        status: "pending",
        deviceFingerprint: navigator.userAgent.slice(0, 100),
        timestamp: serverTimestamp()
      });

      // Deduct from profit wallet immediately to lock balance
      await updateDoc(doc(db, "users", userData.id), {
        profit: (userData.profit || 0) - wAmount
      });

      // Submit user notification
      await addDoc(collection(db, `users/${userData.id}/notifications`), {
        title: "💸 Withdrawal Request Submitted",
        message: `Your withdrawal of Rs. ${wAmount} has been sent. Status will update to Approved once paid.`,
        read: false,
        timestamp: serverTimestamp()
      });

      setMsg({ type: "success", text: "✅ Payout request submitted! Your wallet was updated." });
      setAmount("");
      setAccountName("");
      setAccountNumber("");
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Connection error. Payout failed to submit." });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) =>
    s === "approved" ? "text-green-400 bg-green-500/10 border-green-500/30"
    : s === "pending" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
    : "text-red-400 bg-red-500/10 border-red-500/30";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Coins className="text-cyan-400 w-8 h-8" /> Withdraw Funds
        </h1>
        <p className="text-gray-400 mt-1">Convert your profit balance directly into bank credit or mobile cash.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-5 rounded-2xl border border-cyan-500/30 shadow-lg">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Profit wallet (Withdrawable)</p>
          <p className="text-3xl font-extrabold text-cyan-400 mt-2">Rs. {userData?.profit || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-5 rounded-2xl border border-green-500/30 shadow-lg">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Invested/Main Balance</p>
          <p className="text-3xl font-extrabold text-green-400 mt-2">Rs. {userData?.balance || 0}</p>
        </div>
      </div>

      {requireRef && (userData?.activeReferralsCount || 0) < 2 && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0 animate-pulse" />
          <div>
            <p className="font-bold text-red-400">Withdrawal Lock: Referrals Required</p>
            <p className="text-xs text-red-300 mt-1">
              Referral prerequisites apply: You must secure at least 2 active depositors under your referral network before requesting withdrawals.
              Current active depositors count: <strong className="text-white text-sm">{userData?.activeReferralsCount || 0}</strong>
            </p>
          </div>
        </div>
      )}

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${msg.type === "success" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      <div className="bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-700">
        <h3 className="font-bold text-white mb-6">Create Payout Request</h3>

        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Payout balances are drawn directly from your Profit Wallet. Standard checks apply.
          </div>
          <div className="pl-6 opacity-90 space-y-0.5">
            <p>• Minimum Single Payout: Rs. {minW}</p>
            <p>• Maximum Single Payout: Rs. {maxW}</p>
            <p>• Withdrawal Service Fee: {feePct}%</p>
            <p>• Estimated Processing Duration: {procTime}</p>
          </div>
        </div>

        {wInstructions && (
          <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded-xl text-xs text-gray-400 leading-relaxed">
            <strong>System Instructions:</strong> {wInstructions}
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Withdrawal Destination</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m)}
                  className={`py-4 px-2 rounded-xl text-xs font-semibold transition flex flex-col items-center gap-1.5 border ${
                    selectedMethod?.id === m.id 
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" 
                      : "bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  <span className="text-2xl">{m.logo || "🏦"}</span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Withdrawal Amount (Rs.)</label>
            <input
              type="number"
              min={minW}
              max={userData?.profit || 0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition font-bold"
              placeholder={`Min Rs. ${minW}`}
              required
            />
            {amount && Number(amount) >= minW && (
              <p className="text-xs text-gray-400 mt-2 ml-1">
                System Fee ({feePct}%): Rs. {Math.floor(Number(amount) * (feePct / 100))} | Net Payable: <span className="text-cyan-400 font-bold">Rs. {Number(amount) - Math.floor(Number(amount) * (feePct / 100))}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Title / Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition font-medium"
              placeholder="e.g. Ali Raza"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {selectedMethod?.name === "Bank Transfer" ? "IBAN / Standard Account Number" : "Mobile Transfer Number"}
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition font-mono"
              placeholder={selectedMethod?.name === "Bank Transfer" ? "e.g. PK49MEZN001234567890" : "e.g. 03001234567"}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 disabled:opacity-40 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/10 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <><ArrowRight className="w-5 h-5" /> Submit Payout request</>
            )}
          </button>
        </form>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
          <h3 className="font-bold text-white mb-4">Payout Transaction Logs</h3>
          <div className="space-y-3">
            {history.map(w => (
              <div key={w.id} className="flex justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition">
                <div>
                  <p className="font-extrabold text-white">Rs. {w.amount}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-normal">
                    {w.method} • {w.accountNumber} <br/>
                    {w.feeAmount > 0 && <span className="text-red-400">Processing Fee: Rs. {w.feeAmount}</span>} {w.feeAmount > 0 && "|"} <span className="text-cyan-400 font-bold">Net Payout: Rs. {w.finalAmount || w.amount}</span>
                  </p>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusColor(w.status)}`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
