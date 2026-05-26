"use client";

import { useState } from "react";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { Download, Database, Users, ArrowDownToLine, CreditCard } from "lucide-react";

export default function DataExport() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const downloadCSV = (data, filename) => {
    if (data.length === 0) {
      setMsg({ type: "error", text: "No data available to export." });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => {
        let val = row[header];
        if (typeof val === 'object' && val !== null) {
          if (val.seconds) val = new Date(val.seconds * 1000).toLocaleString();
          else val = JSON.stringify(val);
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMsg({ type: "success", text: `✅ ${filename} exported successfully!` });
  };

  const handleExport = async (collectionName, filename) => {
    setLoading(true);
    setMsg(null);
    try {
      const snap = await getDocs(collection(db, collectionName));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      downloadCSV(data, filename);
    } catch (err) {
      setMsg({ type: "error", text: "Failed to export data: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-400" /> Database Export
        </h2>
        <p className="text-gray-400 text-sm mt-1">Download your platform's raw data in CSV format for accounting and backups.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          msg.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" :
          "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <p className="font-medium text-sm">{msg.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Users Export */}
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">Users Database</h3>
          <p className="text-sm text-gray-400 mb-6">Export all registered users, their balances, emails, phone numbers, and KYC status.</p>
          <button 
            onClick={() => handleExport("users", "DPPK_Users")}
            disabled={loading}
            className="w-full bg-gray-900 border border-gray-700 hover:border-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 mt-auto"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>

        {/* Deposits Export */}
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-400">
            <ArrowDownToLine className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">Deposits History</h3>
          <p className="text-sm text-gray-400 mb-6">Export all approved, pending, and rejected deposit transactions with TIDs.</p>
          <button 
            onClick={() => handleExport("deposits", "DPPK_Deposits")}
            disabled={loading}
            className="w-full bg-gray-900 border border-gray-700 hover:border-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 mt-auto"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>

        {/* Withdrawals Export */}
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-400">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">Withdrawals History</h3>
          <p className="text-sm text-gray-400 mb-6">Export all payout requests, including bank details, amounts, and tax deductions.</p>
          <button 
            onClick={() => handleExport("withdrawals", "DPPK_Withdrawals")}
            disabled={loading}
            className="w-full bg-gray-900 border border-gray-700 hover:border-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 mt-auto"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
        </div>

      </div>
    </div>
  );
}
