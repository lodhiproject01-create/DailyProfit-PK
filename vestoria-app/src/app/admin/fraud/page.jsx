"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { ShieldAlert, AlertTriangle, UserX, ArrowDownToLine } from "lucide-react";

export default function FraudAndRisk() {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [duplicateDeposits, setDuplicateDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Banned Users
    const unSubUsers = onSnapshot(query(collection(db, "users"), where("status", "==", "banned")), (snap) => {
      setBannedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch All Pending Deposits to check for Duplicate TIDs
    const unSubDeps = onSnapshot(query(collection(db, "deposits"), where("status", "==", "pending")), (snap) => {
      const allPending = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const tidMap = {};
      const duplicates = [];
      
      allPending.forEach(d => {
        if (tidMap[d.tid]) {
          duplicates.push(d);
          duplicates.push(tidMap[d.tid]);
        } else {
          tidMap[d.tid] = d;
        }
      });
      
      // Remove same object refs and sort
      const uniqueDupes = [...new Set(duplicates)].sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0));
      setDuplicateDeposits(uniqueDupes);
      setLoading(false);
    });

    return () => { unSubUsers(); unSubDeps(); };
  }, []);

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500" /> Fraud & Risk Monitoring
        </h2>
        <p className="text-gray-400 text-sm mt-1">Automatic detection of suspicious activities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Duplicate TIDs Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Duplicate Pending TIDs</h3>
              <p className="text-xs text-gray-500">Multiple users claiming the same transaction.</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {duplicateDeposits.length === 0 ? (
              <p className="text-sm text-green-400 p-4 bg-green-500/10 rounded-xl text-center">No duplicate transactions detected.</p>
            ) : (
              duplicateDeposits.map(d => (
                <div key={d.id} className="bg-gray-800 p-4 rounded-2xl border border-orange-500/30">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-400">TID: <span className="font-mono text-white font-bold">{d.tid}</span></p>
                    <span className="text-[10px] font-bold px-2 py-1 bg-red-500/20 text-red-400 rounded">HIGH RISK</span>
                  </div>
                  <p className="font-bold text-white">{d.email}</p>
                  <p className="text-sm text-green-400 font-bold">Rs. {d.amount}</p>
                  <p className="text-xs text-gray-500 mt-2">Check Deposits tab to reject this claim.</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Banned Users Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <UserX className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Banned Accounts</h3>
              <p className="text-xs text-gray-500">Users blocked from accessing the platform.</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {bannedUsers.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 bg-gray-800 rounded-xl text-center">No banned users.</p>
            ) : (
              bannedUsers.map(u => (
                <div key={u.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-2xl border border-gray-700">
                  <div>
                    <p className="font-bold text-white">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">BANNED</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">{u.id.substring(0,8)}...</p>
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
