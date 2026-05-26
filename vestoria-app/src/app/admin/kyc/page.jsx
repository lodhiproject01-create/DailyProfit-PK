"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { CheckCircle, XCircle, FileImage, ShieldCheck } from "lucide-react";

export default function KYCManagement() {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    // Only fetch users who have submitted KYC and are pending
    const q = query(collection(db, "users"), where("kycStatus", "==", "pending"));
    const unSub = onSnapshot(q, (snap) => {
      setKycRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unSub();
  }, []);

  const handleApprove = async (userId) => {
    if (!window.confirm("Approve this user's KYC? They will receive a verified badge.")) return;
    try {
      await updateDoc(doc(db, "users", userId), { kycStatus: "verified" });
    } catch (err) {
      alert("Error approving KYC");
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Reject this KYC document?")) return;
    try {
      await updateDoc(doc(db, "users", userId), { kycStatus: "rejected", kycDocument: null });
    } catch (err) {
      alert("Error rejecting KYC");
    }
  };

  if (loading) return <div className="animate-pulse w-full h-96 bg-gray-900 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-500" /> KYC Verification (Identity)
        </h2>
        <p className="text-gray-400 text-sm mt-1">Review and approve user identity documents (CNIC/Passport).</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-800/50 border-b border-gray-800 text-gray-400">
            <tr>
              <th className="p-4 font-medium">User Details</th>
              <th className="p-4 font-medium">CNIC / ID Number</th>
              <th className="p-4 font-medium">Document Proof</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {kycRequests.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">No pending KYC requests.</td>
              </tr>
            ) : (
              kycRequests.map(user => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition">
                  <td className="p-4">
                    <p className="font-bold text-white">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="p-4 font-mono text-gray-300">
                    {user.kycNumber || "N/A"}
                  </td>
                  <td className="p-4">
                    {user.kycDocument ? (
                      <button onClick={() => setPreviewImg(user.kycDocument)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-xl transition">
                        <FileImage className="w-4 h-4" /> View Document
                      </button>
                    ) : (
                      <span className="text-gray-600">No Document</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleApprove(user.id)} className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition" title="Approve">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleReject(user.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition" title="Reject">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {previewImg && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="KYC Document" className="max-w-full max-h-[90vh] rounded-xl object-contain border border-gray-700 shadow-2xl" />
        </div>
      )}
    </div>
  );
}
