"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import {
  collection, addDoc, query, where, getDocs, serverTimestamp, doc, getDoc, onSnapshot
} from "firebase/firestore";
import { Upload, ArrowRight, ShieldCheck, Copy, Clock, AlertTriangle, CheckCircle, Smartphone } from "lucide-react";

export default function Deposit() {
  const { userData } = useStore();
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  const [amount, setAmount] = useState("");
  const [tid, setTid] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pastDeposits, setPastDeposits] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [msg, setMsg] = useState(null);

  // Load payment methods dynamically from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payment_methods"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.status !== false);
      
      // Fallback defaults if database is empty
      if (list.length === 0) {
        const fallbacks = [
          { id: "jazz", name: "JazzCash", logo: "📱", title: "DailyProfit PK Co.", number: "0300-1234567", minDeposit: 100, maxDeposit: 50000, instructions: "Send JazzCash funds directly. Double check title Ali Hassan before transferring." },
          { id: "ep", name: "EasyPaisa", logo: "💚", title: "DailyProfit PK Co.", number: "0301-7654321", minDeposit: 100, maxDeposit: 50000, instructions: "Transfer EasyPaisa funds. Submit dynamic screenshot." },
          { id: "bank", name: "Bank Transfer", logo: "🏦", title: "DailyProfit PK Ltd.", number: "0123456789", iban: "PK49MEZN001234567890", minDeposit: 1000, maxDeposit: 500000, instructions: "Meezan Bank Ltd. Please add DailyProfit in Reference." }
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

  // Fetch past deposits
  useEffect(() => {
    if (!userData?.id) return;

    const unsubDeps = onSnapshot(
      query(collection(db, "deposits"), where("userId", "==", userData.id)),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setPastDeposits(list);

        // Cooldown evaluation: check latest pending deposit
        const latestPending = list.find(d => d.status === "pending");
        if (latestPending) {
          const elapsed = Date.now() / 1000 - (latestPending.timestamp?.seconds || 0);
          if (elapsed < 300) { // 5 minutes cooldown
            setCooldown(true);
            setCooldownTime(Math.ceil(300 - elapsed));
          }
        }
      }
    );

    return () => unsubDeps();
  }, [userData]);

  // Countdown timer for cooldown
  useEffect(() => {
    if (!cooldown || cooldownTime <= 0) return;
    const timer = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          setCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown, cooldownTime]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMsg({ type: "info", text: "Copied to clipboard!" });
    setTimeout(() => setMsg(null), 2000);
  };

  // TID format validation
  const validateTidFormat = (input, providerName) => {
    const pName = providerName.toLowerCase();
    const clean = input.trim();

    if (pName.includes("easypaisa")) {
      // EasyPaisa has 11 or 12 digits
      return /^\d{11,12}$/.test(clean);
    }
    if (pName.includes("jazzcash")) {
      // JazzCash has 11 digits
      return /^\d{11}$/.test(clean);
    }
    if (pName.includes("usdt")) {
      // USDT TRC20 begins with T and is 34 chars long
      return /^T[A-Za-z0-9]{33}$/.test(clean);
    }
    if (pName.includes("binance")) {
      // Binance pay has 9 digit pay ID or numeric
      return /^\d{9,16}$/.test(clean);
    }
    // General fallback: min 8 characters alphanumeric
    return /^[A-Za-z0-9-]{8,}$/.test(clean);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!userData || !selectedMethod) return;

    const depAmount = Number(amount);
    if (depAmount < selectedMethod.minDeposit) {
      return setMsg({ type: "error", text: `Minimum deposit for ${selectedMethod.name} is Rs. ${selectedMethod.minDeposit}` });
    }
    if (depAmount > selectedMethod.maxDeposit) {
      return setMsg({ type: "error", text: `Maximum deposit limit is Rs. ${selectedMethod.maxDeposit}` });
    }

    // 1. Validate Transaction ID Format
    const isValidFormat = validateTidFormat(tid, selectedMethod.name);
    if (!isValidFormat) {
      return setMsg({
        type: "error",
        text: `⚠️ Invalid Transaction ID format for ${selectedMethod.name}. Please enter the correct transfer reference.`
      });
    }

    setLoading(true);
    setMsg(null);

    try {
      // 2. Scan database for matching TID to block duplicates
      const tidCheckSnap = await getDocs(query(collection(db, "deposits"), where("tid", "==", tid)));
      
      let riskScore = 15; // Low baseline
      let riskLevel = "low";
      let isDuplicate = false;

      if (!tidCheckSnap.empty) {
        isDuplicate = true;
        riskScore = 95;
        riskLevel = "high";

        // Log to fraud system
        await addDoc(collection(db, "fraud_logs"), {
          userId: userData.id,
          email: userData.email,
          tid,
          flagType: "Duplicate Transaction ID",
          riskScore,
          riskLevel,
          details: `Submitted identical transaction ID ${tid} matching existing records. Attempt blocked or flagged.`,
          timestamp: serverTimestamp()
        });

        // Add user notification
        await addDoc(collection(db, `users/${userData.id}/notifications`), {
          title: "⚠️ Security Alert: Duplicate TxID Flagged",
          message: `Your deposit request with TID ${tid} was flagged for suspicious matching transaction references. Admin is investigating.`,
          read: false,
          timestamp: serverTimestamp()
        });

        setLoading(false);
        return setMsg({
          type: "error",
          text: "⚠️ Duplicate Transaction ID detected! Submitting duplicate references is flagged automatically under fraud guidelines."
        });
      }

      // Calculate simple upload proof
      let screenshotUrl = "";
      if (screenshot) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", screenshot);
        formData.append("upload_preset", "dailyprofit_preset");
        formData.append("cloud_name", "dtuay731d");

        try {
          const res = await fetch("https://api.cloudinary.com/v1_1/dtuay731d/image/upload", {
            method: "POST",
            body: formData
          });
          const data = await res.json();
          screenshotUrl = data.secure_url || "";
        } catch {
          setMsg({ type: "error", text: "Proof upload failed. Please try again." });
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Check if this user had recent deposits to adjust risk score
      const recentDepsSnap = await getDocs(query(collection(db, "deposits"), where("userId", "==", userData.id)));
      const totalRecent = recentDepsSnap.size;
      if (totalRecent > 3) {
        riskScore += 10; // slightly higher logic baseline
      }
      if (userData.kycStatus !== "verified") {
        riskScore += 15; // unverified accounts get higher risk score
      }
      if (depAmount > 15000) {
        riskScore += 20; // high amount verification checks
      }

      if (riskScore >= 70) riskLevel = "high";
      else if (riskScore >= 40) riskLevel = "medium";

      // 3. Save dynamic deposit request
      await addDoc(collection(db, "deposits"), {
        userId: userData.id,
        email: userData.email,
        name: userData.name,
        amount: depAmount,
        tid,
        method: selectedMethod.name,
        screenshotUrl,
        status: "pending",
        riskScore,
        riskLevel,
        kycStatus: userData.kycStatus || "unverified",
        deviceFingerprint: navigator.userAgent.slice(0, 100),
        timestamp: serverTimestamp()
      });

      // Submit direct user notification
      await addDoc(collection(db, `users/${userData.id}/notifications`), {
        title: "✅ Deposit Submitted",
        message: `Your deposit of Rs. ${depAmount} via ${selectedMethod.name} has been received and is queued for verification.`,
        read: false,
        timestamp: serverTimestamp()
      });

      setMsg({ type: "success", text: "✅ Deposit request sent! Our billing system will credit your balance shortly." });
      setAmount("");
      setTid("");
      setScreenshot(null);
      setCooldown(true);
      setCooldownTime(300); // 5 mins cooldown

    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Database network failure. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) => 
    s === "approved" ? "text-green-400 bg-green-500/10 border-green-500/30" : 
    s === "pending" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" : 
    s === "suspicious" ? "text-orange-400 bg-orange-500/10 border-orange-500/30" :
    "text-red-400 bg-red-500/10 border-red-500/30";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Smartphone className="text-green-500 w-8 h-8" /> Deposit Funds
        </h1>
        <p className="text-gray-400 mt-1">Make direct transfers to dynamically verified billing channels below.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${
          msg.type === "success" ? "bg-green-500/20 text-green-400 border-green-500/30" : 
          msg.type === "error" ? "bg-red-500/20 text-red-400 border-red-500/30" : 
          "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Selector card */}
      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
        <h3 className="font-bold text-white mb-4">Choose Billing Gateway</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {methods.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMethod(m)}
              className={`p-4 rounded-xl text-sm font-medium transition flex flex-col items-center gap-2 border ${
                selectedMethod?.id === m.id 
                  ? "bg-green-500/20 text-green-400 border-green-500/50" 
                  : "bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-700"
              }`}
            >
              <span className="text-3xl">{m.logo || "📱"}</span>
              <span className="font-bold">{m.name}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Billing details */}
        {selectedMethod && (
          <div className="bg-gray-900 p-5 rounded-2xl border border-gray-700 space-y-4">
            <h4 className="text-sm font-bold text-green-400 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5" /> Transfer funds to this address:
            </h4>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Account Title:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{selectedMethod.title}</span>
                  <button onClick={() => copyToClipboard(selectedMethod.title)} className="text-gray-500 hover:text-green-400">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono font-bold text-base">{selectedMethod.number}</span>
                  <button onClick={() => copyToClipboard(selectedMethod.number)} className="text-gray-500 hover:text-green-400">
                    <Copy className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {selectedMethod.iban && (
                <div className="flex justify-between items-center border-t border-gray-800 pt-2">
                  <span className="text-gray-400">IBAN:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-xs font-semibold">{selectedMethod.iban}</span>
                    <button onClick={() => copyToClipboard(selectedMethod.iban)} className="text-gray-500 hover:text-green-400">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-gray-800 pt-2 text-xs">
                <span className="text-gray-400">Transaction Range:</span>
                <span className="text-yellow-400 font-semibold">Min: Rs. {selectedMethod.minDeposit} | Max: Rs. {selectedMethod.maxDeposit}</span>
              </div>
            </div>

            {/* Custom Billing Instructions */}
            {selectedMethod.instructions && (
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs text-gray-400 leading-relaxed">
                <strong>Instructions:</strong> {selectedMethod.instructions}
              </div>
            )}

            {/* QR Code Display */}
            {selectedMethod.qrUrl && (
              <div className="flex flex-col items-center border-t border-gray-800 pt-4 gap-2">
                <p className="text-xs text-gray-500 font-semibold uppercase">Scan QR code to pay</p>
                <img src={selectedMethod.qrUrl} alt="Deposit QR Code" className="w-40 h-40 rounded-xl border border-gray-800 object-contain bg-white p-1.5 shadow" />
              </div>
            )}

            <p className="text-yellow-500/80 text-xs flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
              Double check billing title Ali Hassan or DailyProfit PK before processing payment.
            </p>
          </div>
        )}
      </div>

      {/* Form Card */}
      {selectedMethod && (
        <div className="bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-700">
          <h3 className="font-bold text-white mb-4">Submit Verification References</h3>
          {cooldown && (
            <div className="mb-4 flex items-center gap-2 p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
              <Clock className="w-4 h-4 flex-shrink-0 animate-spin" />
              Wait <strong>{Math.floor(cooldownTime / 60)}m {cooldownTime % 60}s</strong> before submitting another request.
            </div>
          )}

          <form onSubmit={handleDeposit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sent Amount (Rs.)</label>
              <input
                type="number"
                min={selectedMethod.minDeposit}
                max={selectedMethod.maxDeposit}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-green-500 transition font-bold"
                placeholder={`Range: Rs. ${selectedMethod.minDeposit} - Rs. ${selectedMethod.maxDeposit}`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction ID / Reference Reference</label>
              <input
                type="text"
                value={tid}
                onChange={(e) => setTid(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-green-500 transition font-mono"
                placeholder="e.g. 11 digit mobile reference or USDT TRC20 TxHash"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Payment Receipt Screenshot</label>
              <div className="relative border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:bg-gray-700 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <Upload className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
                <span className="text-sm text-gray-300">
                  {screenshot ? <span className="text-green-400 font-medium">✓ {screenshot.name}</span> : "Tap to select receipt image"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading || cooldown}
              className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:brightness-110 disabled:opacity-40 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/10 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
              ) : uploading ? (
                "Uploading Receipt..."
              ) : (
                <><ArrowRight className="w-5 h-5" /> Submit Deposit references</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* History */}
      {pastDeposits.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
          <h3 className="font-bold text-white mb-4">Past Transfers History</h3>
          <div className="space-y-3">
            {pastDeposits.map(d => (
              <div key={d.id} className="flex justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition">
                <div>
                  <p className="font-extrabold text-white">Rs. {d.amount}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{d.tid} • {d.method}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusColor(d.status)}`}>
                    {d.status}
                  </span>
                  {d.riskLevel === 'high' && d.status === 'pending' && (
                    <span className="text-[9px] text-red-400 font-bold flex items-center gap-0.5 bg-red-950 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" /> Flagged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
