"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { Search, CheckCircle, XCircle } from "lucide-react";

export default function WithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "withdrawals")), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWithdrawals(data.sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0)));
      setLoading(false);
    });
    return () => unSub();
  }, []);

  const handleApprove = async (wid) => {
    if(!window.confirm(`Mark Rs. ${wid.amount} for ${wid.email} as PAID?`)) return;
    try {
      await updateDoc(doc(db, "withdrawals", wid.id), { status: "approved" });
    } catch (err) { alert("Error approving."); }
  };

  const handleReject = async (wid) => {
    if(!window.confirm("Reject withdrawal and refund amount to user's profit wallet?")) return;
    try {
      const userRef = doc(db, "users", wid.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, { profit: (userSnap.data().profit || 0) + wid.amount });
      }
      await updateDoc(doc(db, "withdrawals", wid.id), { status: "rejected" });
    } catch (err) { alert("Error rejecting withdrawal."); }
  };

  const filtered = withdrawals.filter(w => 
    (w.email || "").toLowerCase().includes(search.toLowerCase()) || 
    (w.accountNumber || "").includes(search)
  );

  const exportCSV = () => {
    const headers = ["Date", "Email", "Method", "AccountName", "AccountNumber", "Amount", "Status"];
    const rows = filtered.map(w => [
      w.timestamp ? `"${new Date(w.timestamp.seconds * 1000).toLocaleString()}"` : 'N/A',
      w.email || "",
      w.method || "",
      w.accountName || "",
      w.accountNumber || "",
      w.amount || 0,
      w.status || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "withdrawals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Withdrawal Management</h2>
          <p className="text-gray-400 text-sm">Process payouts and refund rejected requests.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={exportCSV} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl transition font-bold text-sm whitespace-nowrap">
            Export CSV
          </button>
          <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search email or account #..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 pl-10 pr-4 py-3 rounded-xl text-white outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-800/50 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-4 font-medium">Date & User</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Payment Details</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition">
                <td className="p-4">
                  <p className="text-xs text-gray-500">{w.timestamp ? new Date(w.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</p>
                  <p className="font-bold text-white mt-1">{w.email}</p>
                </td>
                <td className="p-4">
                  <p className="text-cyan-400 font-extrabold text-lg">Rs. {w.amount}</p>
                  {w.feeAmount > 0 && (
                    <p className="text-[10px] text-gray-400">
                      Fee: Rs. {w.feeAmount} | Send: <span className="text-white font-bold">Rs. {w.finalAmount}</span>
                    </p>
                  )}
                </td>
                <td className="p-4">
                  <p className="font-bold text-white">{w.method}</p>
                  <p className="text-xs text-gray-400">{w.accountName} - <span className="font-mono">{w.accountNumber}</span></p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                    w.status === 'approved' ? 'bg-cyan-500/20 text-cyan-400' :
                    w.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {w.status}
                  </span>
                </td>
                <td className="p-4">
                  {w.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleApprove(w)} className="p-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition" title="Mark Paid">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleReject(w)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition" title="Reject & Refund">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
