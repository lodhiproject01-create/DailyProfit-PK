"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Trophy, Medal, Star, Target, Users } from "lucide-react";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("referralEarnings", "desc"), limit(10));
        const snap = await getDocs(q);
        
        // Filter out those with 0 or undefined earnings
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.referralEarnings && u.referralEarnings > 0);
          
        setLeaders(data);
      } catch (err) {
        console.error("Leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="animate-pulse h-32 bg-gray-800 rounded-3xl" />
      <div className="animate-pulse h-96 bg-gray-800 rounded-3xl" />
    </div>
  );

  const maskEmail = (email) => {
    if (!email) return "User***";
    const [name, domain] = email.split("@");
    return `${name.substring(0, 3)}***@${domain}`;
  };

  const getRankBadge = (index) => {
    if (index === 0) return <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.5)]"><Trophy className="w-5 h-5 text-yellow-400" /></div>;
    if (index === 1) return <div className="w-10 h-10 rounded-full bg-gray-300/20 flex items-center justify-center border border-gray-300/50"><Medal className="w-5 h-5 text-gray-300" /></div>;
    if (index === 2) return <div className="w-10 h-10 rounded-full bg-orange-700/20 flex items-center justify-center border border-orange-700/50"><Medal className="w-5 h-5 text-orange-400" /></div>;
    return <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400">#{index + 1}</div>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-20">
          <Trophy className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-4 border border-white/20">
            <Target className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2">Top Promoters</h1>
          <p className="text-blue-100 max-w-lg mx-auto">
            Compete with other investors! Invite friends and build your team to climb the leaderboard and earn massive commission rewards.
          </p>
        </div>
      </div>

      {/* Leaderboard Table/List */}
      <div className="bg-gray-800 border border-gray-700 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-700 bg-gray-800/80 flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Global Ranking</h2>
        </div>

        {leaders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No leaders yet. Start inviting friends to be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {leaders.map((user, index) => (
              <div 
                key={user.id} 
                className={`flex items-center justify-between p-4 md:p-6 transition-colors hover:bg-gray-700/30 ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : 
                  index === 1 ? 'bg-gradient-to-r from-gray-400/5 to-transparent' :
                  index === 2 ? 'bg-gradient-to-r from-orange-500/5 to-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-4 md:gap-6">
                  {getRankBadge(index)}
                  <div>
                    <h3 className={`font-bold text-lg md:text-xl ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-white'}`}>
                      {user.name || "Anonymous"}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400">{maskEmail(user.email)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Total Earned</p>
                  <p className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                    Rs. {(user.referralEarnings || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-gray-500 text-sm flex items-center justify-center gap-2">
        <Star className="w-4 h-4" /> Rankings are based on total referral commissions earned.
      </div>
    </div>
  );
}
