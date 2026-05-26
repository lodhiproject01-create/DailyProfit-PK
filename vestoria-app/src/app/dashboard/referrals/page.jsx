"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Copy, Users, TrendingUp, Gift, Trophy } from "lucide-react";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Referrals() {
  const { userData } = useStore();
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (!userData?.id) return;
    const fetchReferrals = async () => {
      const q = query(collection(db, "users"), where("referredBy", "==", userData.id));
      const snap = await getDocs(q);
      setReferralCount(snap.size);
    };
    fetchReferrals();
  }, [userData]);

  const referralLink = `https://dailyprofit-pk.vercel.app/signup?ref=${userData?.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied!");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Referral Program</h1>
          <p className="text-gray-400">Invite friends and earn 10% commission on their first deposit.</p>
        </div>
        <a href="/dashboard/leaderboard" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:brightness-110 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 transition whitespace-nowrap">
          <Trophy className="w-5 h-5" /> View Leaderboard
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Users className="w-24 h-24 text-green-400" />
          </div>
          <p className="text-gray-400 font-medium mb-1 relative z-10">Total Referrals</p>
          <p className="text-4xl font-bold text-white relative z-10">{referralCount}</p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Gift className="w-24 h-24 text-purple-400" />
          </div>
          <p className="text-gray-400 font-medium mb-1 relative z-10">Total Earned</p>
          <p className="text-4xl font-bold text-cyan-400 relative z-10">Rs. {userData?.referralEarnings || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <TrendingUp className="w-24 h-24 text-blue-400" />
          </div>
          <p className="text-gray-400 font-medium mb-1 relative z-10">Active Team</p>
          <p className="text-4xl font-bold text-green-400 relative z-10">0</p>
        </div>
      </div>

      <div className="bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-700 text-center">
        <h3 className="text-xl font-bold mb-6">Your Unique Referral Link</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
          <div className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-gray-300 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
            {referralLink}
          </div>
          <button 
            onClick={copyToClipboard}
            className="w-full md:w-auto bg-green-500 hover:bg-green-400 text-gray-900 font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Copy className="w-5 h-5" /> Copy Link
          </button>
        </div>
        
        <p className="mt-6 text-sm text-gray-400">
          Share this link with your friends. Once they sign up and make a deposit, your 10% commission will be instantly credited to your Main Balance.
        </p>
      </div>
    </div>
  );
}
