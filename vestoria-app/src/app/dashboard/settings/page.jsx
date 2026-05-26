"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { db, auth } from "@/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth";
import { User, Mail, Phone, Lock, LogOut, Save, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { ProfileImageUploader, ImageUploader } from "@/components/CloudinaryUploader";

export default function Settings() {
  const { userData, user } = useStore();
  const [name, setName] = useState(userData?.name || "");
  const [phone, setPhone] = useState(userData?.phone || "");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycNumber, setKycNumber] = useState("");
  const [kycImg, setKycImg] = useState("");
  const [kycCloudinaryData, setKycCloudinaryData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [features, setFeatures] = useState({ kyc: true });

  useEffect(() => {
    import("firebase/firestore").then(({ doc, getDoc }) => {
      getDoc(doc(db, "settings", "general")).then((snap) => {
        if (snap.exists() && snap.data().features) setFeatures(snap.data().features);
      });
    });
  }, []);

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setPhone(userData.phone || "");
    }
  }, [userData]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleAvatarUpload = async (imgData) => {
    if (!userData?.id || !imgData) return;
    try {
      await updateDoc(doc(db, "users", userData.id), {
        profileImage: imgData.image_url,
        profileImagePublicId: imgData.public_id || "",
        profileImageUploadTime: imgData.upload_time || new Date().toISOString()
      });
      showMsg("success", "✅ Profile picture updated!");
    } catch {
      showMsg("error", "Failed to update profile picture.");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!userData?.id) return;
    setLoadingProfile(true);
    try {
      await updateDoc(doc(db, "users", userData.id), { name, phone });
      showMsg("success", "✅ Profile updated successfully!");
    } catch {
      showMsg("error", "Failed to update profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (newPw.length < 6) return showMsg("error", "New password must be at least 6 characters.");
    setLoadingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      showMsg("success", "✅ Password changed successfully!");
      setOldPw("");
      setNewPw("");
    } catch (err) {
      showMsg("error", err.code === "auth/wrong-password" ? "Current password is incorrect." : err.message);
    } finally {
      setLoadingPw(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycNumber || !kycCloudinaryData) return showMsg("error", "Please provide both ID Number and upload your document screenshot.");
    setLoadingKyc(true);
    try {
      await updateDoc(doc(db, "users", userData.id), {
        kycStatus: "pending",
        kycNumber,
        kycDocument: kycCloudinaryData.image_url,
        kycDocumentPublicId: kycCloudinaryData.public_id || "",
        kycDocumentUploadTime: kycCloudinaryData.upload_time || new Date().toISOString()
      });
      showMsg("success", "✅ KYC submitted for admin review.");
      setKycNumber("");
      setKycCloudinaryData(null);
    } catch (err) {
      showMsg("error", "Failed to submit KYC");
    } finally {
      setLoadingKyc(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your profile and security preferences.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${msg.type === "success" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
          {msg.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-700">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <User className="text-cyan-400" /> Profile Information
        </h3>

        {/* Avatar */}
        <div className="flex items-center gap-6 mb-6">
          <ProfileImageUploader 
            currentUrl={userData?.profileImage || ""} 
            userId={userData?.id} 
            onUploadSuccess={handleAvatarUpload} 
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-lg">{userData?.name}</p>
              {userData?.kycStatus === "verified" && (
                <ShieldCheck className="w-5 h-5 text-cyan-400" title="Verified Account" />
              )}
            </div>
            <p className="text-gray-400 text-sm">{userData?.email}</p>
            <p className="text-xs text-gray-500 font-mono mt-1">ID: {userData?.id?.slice(0, 12)}...</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
              <User className="w-4 h-4" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
              <Mail className="w-4 h-4" /> Email
            </label>
            <div className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-500 cursor-not-allowed">
              {userData?.email}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
              <Phone className="w-4 h-4" /> Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition"
              placeholder="03xx-xxxxxxx"
            />
          </div>
          <button
            type="submit"
            disabled={loadingProfile}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:brightness-110 text-gray-900 font-bold px-6 py-3 rounded-xl transition disabled:opacity-70"
          >
            {loadingProfile
              ? <div className="w-4 h-4 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-700">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <Lock className="text-green-400" /> Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="relative">
            <input
              type={showOldPw ? "text" : "password"}
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              placeholder="Current Password"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white pr-12 focus:outline-none focus:border-cyan-500 transition"
              required
            />
            <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {showOldPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNewPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New Password (min 6 chars)"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white pr-12 focus:outline-none focus:border-cyan-500 transition"
              required
            />
            <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loadingPw}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            {loadingPw
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>

      {/* KYC Verification */}
      {features.kyc !== false && (
        <div className="bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-700">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <ShieldCheck className={userData?.kycStatus === 'verified' ? 'text-blue-400' : 'text-gray-400'} /> Identity Verification
            </h3>
            {userData?.kycStatus === "verified" && (
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">VERIFIED</span>
            )}
            {userData?.kycStatus === "pending" && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/30">PENDING REVIEW</span>
            )}
            {userData?.kycStatus === "rejected" && (
              <span className="bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">REJECTED</span>
            )}
          </div>

          {userData?.kycStatus === "verified" ? (
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-blue-400 text-sm">
              Your identity has been successfully verified by the administration. You have full access to all platform features.
            </div>
          ) : userData?.kycStatus === "pending" ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-yellow-400 text-sm">
              Your documents are currently under review. This usually takes 24-48 hours.
            </div>
          ) : (
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">Upload your CNIC or Passport to verify your account and unlock higher limits.</p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">CNIC / ID Number</label>
                <input
                  type="text"
                  value={kycNumber}
                  onChange={(e) => setKycNumber(e.target.value)}
                  placeholder="e.g. 12345-1234567-1"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Upload CNIC / Document Image</label>
                <ImageUploader 
                  imageType="kyc" 
                  userId={userData?.id} 
                  onUploadSuccess={setKycCloudinaryData}
                  label="CNIC Document Receipt" 
                />
              </div>
              <button
                type="submit"
                disabled={loadingKyc}
                className="flex items-center justify-center w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold px-6 py-4 rounded-xl transition mt-2"
              >
                {loadingKyc
                  ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : "Submit for Verification"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Wallet balances display */}
      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">Wallet Overview</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 text-center">
            <p className="text-gray-400 text-xs mb-1">Main Balance</p>
            <p className="font-extrabold text-green-400">Rs. {userData?.balance || 0}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 text-center">
            <p className="text-gray-400 text-xs mb-1">Profit Wallet</p>
            <p className="font-extrabold text-cyan-400">Rs. {userData?.profit || 0}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-700 text-center">
            <p className="text-gray-400 text-xs mb-1">Referral Earned</p>
            <p className="font-extrabold text-purple-400">Rs. {userData?.referralEarnings || 0}</p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold py-4 rounded-2xl transition"
      >
        <LogOut className="w-5 h-5" /> Sign Out
      </button>
    </div>
  );
}
