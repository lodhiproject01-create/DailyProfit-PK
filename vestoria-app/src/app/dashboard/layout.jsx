"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase/config";
import { doc, onSnapshot, collection, getDocs, setDoc } from "firebase/firestore";
import { useStore } from "@/store/useStore";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import InstallPWA from "@/components/InstallPWA";
import { Bell, Settings as SettingsIcon, LogOut } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { setUser, setUserData, userData, setPlans } = useStore();
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    // Listen to general settings
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (doc) => {
      if (doc.exists()) {
        setMaintenance(doc.data().maintenance || false);
      }
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      const plansSnap = await getDocs(collection(db, "plans"));
      if (plansSnap.empty) {
        const defaultPlans = [
          { id: "1", name: "Starter Plan", price: 1000, dailyProfit: 50, durationDays: 30, color: "from-green-500 to-cyan-500" },
          { id: "2", name: "Pro Plan", price: 5000, dailyProfit: 300, durationDays: 30, color: "from-purple-500 to-blue-500" },
          { id: "3", name: "Elite Plan", price: 10000, dailyProfit: 700, durationDays: 30, color: "from-orange-500 to-red-500" }
        ];
        defaultPlans.forEach(async (p) => await setDoc(doc(db, "plans", p.id), p));
        setPlans(defaultPlans);
      } else {
        const fetchedPlans = plansSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPlans(fetchedPlans.sort((a,b) => a.price - b.price));
      }
    };
    fetchPlans();
  }, [setPlans]);

  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        const targetId = useStore.getState().impersonatingId || u.uid;
        
        // Listen to User Data
        const unsubscribeDoc = onSnapshot(doc(db, "users", targetId), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({ id: targetId, ...data });
            localStorage.setItem(`dppk_user_role_${targetId}`, data.role || "user");
          }
          setLoading(false);
        });

        // Listen to Unread Notifications
        const unsubscribeNotifs = onSnapshot(collection(db, "users", targetId, "notifications"), (snap) => {
          const unreadCount = snap.docs.filter(d => !d.data().read).length;
          setUnreadNotifs(unreadCount);
        });

        return () => { unsubscribeDoc(); unsubscribeNotifs(); };
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribeAuth();
  }, [router, setUser, setUserData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  if (maintenance && userData?.role !== "admin") {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#0B0F19] text-center p-6">
        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <SettingsIcon className="w-12 h-12 text-red-500 animate-[spin_3s_linear_infinite]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Under Maintenance</h1>
        <p className="text-gray-400 max-w-md mx-auto">
          We are currently upgrading the platform to serve you better. 
          Please check back later. Your funds are 100% safe!
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center z-30">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400">
            DPPK
          </h2>
          <div className="flex items-center gap-3">
            {useStore.getState().impersonatingId && (
              <button 
                onClick={() => { useStore.getState().setImpersonatingId(null); window.location.reload(); }}
                className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded"
              >
                Stop Impersonating
              </button>
            )}
            <Link href="/dashboard/notifications" className="relative p-2 bg-gray-800 rounded-full">
              <Bell className="w-5 h-5 text-gray-400" />
              {unreadNotifs > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-gray-900">{unreadNotifs}</span>}
            </Link>
            <Link href="/dashboard/settings" className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center font-bold cursor-pointer hover:opacity-80 transition">
              {(userData?.name || "U").charAt(0).toUpperCase()}
            </Link>
            <button 
              onClick={() => auth.signOut()}
              className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-gray-900 border-b border-gray-800 p-4 justify-between items-center z-30">
          <h2 className="text-xl font-semibold text-gray-200">Dashboard Overview</h2>
          <div className="flex items-center gap-4">
            {useStore.getState().impersonatingId && (
              <button 
                onClick={() => { useStore.getState().setImpersonatingId(null); window.location.reload(); }}
                className="bg-red-500/20 text-red-400 text-sm font-bold px-4 py-2 rounded-xl border border-red-500/30"
              >
                Stop Impersonating
              </button>
            )}
            <Link href="/dashboard/notifications" className="relative p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
              <Bell className="w-5 h-5 text-gray-400" />
              {unreadNotifs > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-gray-900">{unreadNotifs}</span>}
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-xl cursor-pointer hover:bg-gray-700 transition">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center font-bold">
                {(userData?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-semibold">{userData?.name}</p>
                <p className="text-gray-400 text-xs">ID: {userData?.id?.slice(0,6)}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 scroll-smooth">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        
        <BottomNav />
      </div>
      <WhatsAppWidget />
      <InstallPWA />
    </div>
  );
}
