"use client";

import { useState, useEffect, Suspense } from "react";
import { auth, db } from "@/firebase/config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, TrendingUp, ArrowRight, Mail, Lock, User } from "lucide-react";

function LoginForm() {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [msg, setMsg] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  // Auto-login redirect if already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const cachedRole = localStorage.getItem(`dppk_user_role_${user.uid}`);
        if (cachedRole) {
          if (["admin", "superadmin", "manager"].includes(cachedRole)) {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
        } else {
          try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) {
              const role = userSnap.data().role || "user";
              localStorage.setItem(`dppk_user_role_${user.uid}`, role);
              if (["admin", "superadmin", "manager"].includes(role)) {
                router.replace("/admin");
                return;
              }
            }
            router.replace("/dashboard");
          } catch (err) {
            console.error("Auth redirect error:", err);
            router.replace("/dashboard");
          }
        }
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0F19]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // Check role in Firestore
        const userSnap = await getDoc(doc(db, "users", cred.user.uid));
        const role = userSnap.exists() ? (userSnap.data().role || "user") : "user";
        localStorage.setItem(`dppk_user_role_${cred.user.uid}`, role);
        if (["admin", "superadmin", "manager"].includes(role)) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // Build user document
        const userData = {
          name,
          email,
          phone: phone || "",
          balance: 0,
          profit: 0,
          referralEarnings: 0,
          role: "user",
          referredBy: refCode || null,
          createdAt: serverTimestamp()
        };

        await setDoc(doc(db, "users", uid), userData);
        localStorage.setItem(`dppk_user_role_${uid}`, "user");

        // If referred, credit 10% of future deposit — just log referral relationship
        // Referral earnings will be handled when admin approves deposit
        if (refCode) {
          const referrerRef = doc(db, "users", refCode);
          const referrerSnap = await getDoc(referrerRef);
          if (referrerSnap.exists()) {
            // Just mark the relationship; earnings credited on deposit approval
            await setDoc(doc(db, "referrals", uid), {
              referrerId: refCode,
              referredUserId: uid,
              referredEmail: email,
              status: "active",
              createdAt: serverTimestamp()
            });
          }
        }

        router.push("/dashboard");
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setMsg({ type: "success", text: "Password reset email sent! Check your inbox." });
      }
    } catch (err) {
      console.error("Auth error:", err);
      let errorText = "";
      if (err.code) {
        switch (err.code) {
          case "auth/email-already-in-use":
            errorText = "This email is already in use. Please log in or use a different email.";
            break;
          case "auth/invalid-email":
            errorText = "Invalid email format. Please check and try again.";
            break;
          case "auth/weak-password":
            errorText = "Password is too weak. It must be at least 6 characters long.";
            break;
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            errorText = "Incorrect email or password. Please try again.";
            break;
          case "auth/too-many-requests":
            errorText = "Too many failed attempts. Access temporarily disabled. Try again later.";
            break;
          default:
            errorText = err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim() || "An error occurred. Please try again.";
        }
      } else {
        errorText = err.message || "An error occurred. Please try again.";
      }
      setMsg({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0F19] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-cyan-500 rounded-2xl mb-4 shadow-lg shadow-green-500/20">
            <TrendingUp className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">DailyProfit PK</h1>
          <p className="text-gray-400 mt-1">Daily Earnings Made Simple</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
          </h2>

          {msg && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number (03xx-xxxxxxx)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-gray-400 hover:text-cyan-400 transition">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 disabled:opacity-70 text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Login" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {mode === "login" ? (
              <p>Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-cyan-400 font-bold hover:underline">Sign Up</button>
              </p>
            ) : (
              <p>Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-cyan-400 font-bold hover:underline">Login</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
