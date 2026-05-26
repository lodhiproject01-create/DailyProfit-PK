"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Settings, Lock, Save, AlertTriangle, ShieldCheck, HelpCircle,
  Link as LinkIcon, Radio, Share2, Smartphone, CheckSquare, Layers
} from "lucide-react";

export default function SystemSettings() {
  const [general, setGeneral] = useState({
    maintenance: false,
    minDeposit: 500,
    referralBonusPct: 10,
    whatsapp: "923000000000",
    telegram: "",
    appLink: "",
    features: {
      investments: true,
      deposit: true,
      withdraw: true,
      passbook: true,
      referrals: true,
      support: true,
      tasks: true,
      promos: true,
      checkin: true,
      leaderboard: true,
      kyc: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const genSnap = await getDoc(doc(db, "settings", "general"));
        if (genSnap.exists()) {
          const data = genSnap.data();
          if (!data.features) {
            data.features = {
              investments: true,
              deposit: true,
              withdraw: true,
              passbook: true,
              referrals: true,
              support: true,
              tasks: true,
              promos: true,
              checkin: true,
              leaderboard: true,
              kyc: true
            };
          }
          setGeneral(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "general"), general, { merge: true });
      showMsg("success", "✅ System configurations updated successfully!");
    } catch (err) {
      console.error(err);
      showMsg("error", "Error saving system settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureToggle = (featureKey) => {
    setGeneral(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey]
      }
    }));
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl border border-gray-800" />;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-400" /> System settings
        </h2>
        <p className="text-gray-400 text-sm mt-1">Configure global application variables, PWA links, support lines, and platform module status.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-semibold border ${
          msg.type === "success" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
        }`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSaveGeneral} className="space-y-6">
        {/* Platform Status & Security Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-6">
          <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-gray-800 pb-4">
            <Lock className="w-5 h-5 text-red-500" /> Security Controls & Limits
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Maintenance Mode Toggle */}
            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-850 flex items-center justify-between">
              <div>
                <p className="font-bold text-white flex items-center gap-1.5">
                  Platform Maintenance Mode
                </p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                  Blocks all user interactions with a maintenance screen. Admin role is exempt and can still login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGeneral({ ...general, maintenance: !general.maintenance })}
                className={`w-14 h-7 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  general.maintenance ? "bg-red-500" : "bg-gray-800"
                }`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform duration-200 ${
                  general.maintenance ? "translate-x-7" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Min Deposit Field */}
            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-850 flex flex-col justify-between">
              <label className="block text-sm font-bold text-white mb-2">Minimum Allowed Deposit (Rs.)</label>
              <input
                type="number"
                value={general.minDeposit || 500}
                onChange={e => setGeneral({ ...general, minDeposit: Number(e.target.value) })}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition font-bold"
                required
              />
            </div>
          </div>
        </div>

        {/* Dynamic Feature Flags Module Switcher */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-6">
          <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-gray-800 pb-4">
            <Layers className="w-5 h-5 text-cyan-400" /> Platform Modules Activation Settings
          </h3>
          <p className="text-xs text-gray-400 leading-normal">
            Disable or enable entire navigation features and client modules instantly platform-wide. Disabled routes automatically block client routing hooks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: "investments", label: "📈 Investment Plans Module" },
              { key: "deposit", label: "💳 Deposit Gateway" },
              { key: "withdraw", label: "💸 Withdrawal Panel" },
              { key: "passbook", label: "📖 Passbook & Transaction Logs" },
              { key: "referrals", label: "🔗 Referral Network System" },
              { key: "support", label: "💬 Support Ticket Portal" },
              { key: "tasks", label: "📋 Task Reward Center" },
              { key: "promos", label: "🎁 Promo Codes System" },
              { key: "checkin", label: "📅 Daily Login Rewards" },
              { key: "leaderboard", label: "🏆 Global Leaderboard" },
              { key: "kyc", label: "🛡️ KYC Verification Portal" }
            ].map(f => (
              <div key={f.key} className="bg-gray-950 p-3.5 rounded-xl border border-gray-850 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">{f.label}</span>
                <button
                  type="button"
                  onClick={() => handleFeatureToggle(f.key)}
                  className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    general.features[f.key] ? "bg-green-500" : "bg-gray-800"
                  }`}
                >
                  <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition-transform duration-200 ${
                    general.features[f.key] ? "translate-x-4.5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Media & Support Channels Link configurations */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 space-y-6">
          <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-gray-800 pb-4">
            <Share2 className="w-5 h-5 text-green-400" /> Support & Communications Config
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Official WhatsApp Support Line</label>
                <input
                  type="text"
                  value={general.whatsapp || ""}
                  onChange={e => setGeneral({ ...general, whatsapp: e.target.value })}
                  placeholder="e.g. 923000000000"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Official Telegram Channel link</label>
                <input
                  type="url"
                  value={general.telegram || ""}
                  onChange={e => setGeneral({ ...general, telegram: e.target.value })}
                  placeholder="e.g. https://t.me/DailyProfitPK"
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Android PWA / APK Direct Download link</label>
              <input
                type="url"
                value={general.appLink || ""}
                onChange={e => setGeneral({ ...general, appLink: e.target.value })}
                placeholder="e.g. https://dailyprofit-pk.vercel.app/app.apk"
                className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Global Announcement Marquee (Scrolling Ticker Text)</label>
              <textarea
                value={general.announcementNotice || ""}
                onChange={e => setGeneral({ ...general, announcementNotice: e.target.value })}
                placeholder="e.g. 📢 Big updates: New high-return plans added! Referral commission is increased to 12%! Direct JazzCash & EasyPaisa payments now operational. Happy earning!"
                rows="2"
                className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 transition text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/10"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save className="w-5 h-5" /> Save Platform Settings</>
          )}
        </button>
      </form>
    </div>
  );
}
