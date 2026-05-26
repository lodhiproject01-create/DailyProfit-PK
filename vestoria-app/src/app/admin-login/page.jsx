"use client";

import { useState } from "react";
import { auth, db } from "@/firebase/config";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const router = useRouter();

  const getAdminEmails = () => {
    const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase())
      : [];
    const defaultEmails = [
      "umarlodhi2020@gmail.com",
      "umarhayat@gmail.com",
      "admin@dailyprofit.pk"
    ];
    return Array.from(new Set([...envEmails, ...defaultEmails]));
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email ? user.email.toLowerCase() : "";

      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const adminEmails = getAdminEmails();
      const isWhitelisted = adminEmails.includes(email);
      const hasExistingAdminRole = userSnap.exists() && ["admin", "superadmin", "manager"].includes(userSnap.data().role);

      if (!isWhitelisted && !hasExistingAdminRole) {
        // Sign out immediately to clean the auth state
        await auth.signOut();
        setMsg("Unauthorized access. Admin only.");
        setLoading(false);
        return;
      }

      if (!userSnap.exists()) {
        // Create as admin since they are whitelisted and don't exist yet
        await setDoc(userRef, {
          name: user.displayName || "Admin",
          email: user.email,
          role: "admin",
          balance: 0,
          profit: 0,
          referralEarnings: 0,
          createdAt: new Date().toISOString()
        });
      } else if (!hasExistingAdminRole && isWhitelisted) {
        // Promote to admin since they are whitelisted but only have user role currently
        await updateDoc(userRef, { role: "admin" });
      }

      router.push("/admin");
    } catch (err) {
      console.error(err);
      setMsg(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0F19] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-4 shadow-lg shadow-red-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Admin Portal</h1>
          <p className="text-gray-400 mt-1">DailyProfit PK Management</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-red-500/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            Staff Authentication
          </h2>

          {msg && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 text-center">
              {msg}
            </div>
          )}

          <p className="text-sm text-gray-400 text-center mb-8">
            Please sign in with your Google account to access the administrative dashboard.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 disabled:opacity-70 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          <button onClick={() => router.push("/login")} className="w-full mt-4 py-4 text-gray-400 hover:text-white transition text-sm font-medium text-center">
            Back to User Login
          </button>
        </div>
      </div>
    </div>
  );
}
