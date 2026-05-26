"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, CreditCard, ArrowDownToLine, Users, Bell, Settings, LogOut, ShieldCheck, MessageSquare, Trophy, History, Gift, ListTodo, CalendarCheck } from "lucide-react";
import { auth, db } from "@/firebase/config";
import { useStore } from "@/store/useStore";
import { doc, onSnapshot } from "firebase/firestore";

export default function Sidebar() {
  const pathname = usePathname();
  const { userData } = useStore();
  const [telegramLink, setTelegramLink] = useState("");
  const [features, setFeatures] = useState({ investments: true, deposit: true, withdraw: true, passbook: true, referrals: true, support: true, tasks: true, promos: true, checkin: true, leaderboard: true });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setTelegramLink(docSnap.data().telegram || "");
        if (docSnap.data().features) setFeatures(docSnap.data().features);
      }
    });
    return () => unsub();
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (features.investments !== false) navItems.push({ name: "Investments", href: "/dashboard/investments", icon: ArrowDownToLine });
  if (features.deposit !== false) navItems.push({ name: "Deposit", href: "/dashboard/deposit", icon: Wallet });
  if (features.withdraw !== false) navItems.push({ name: "Withdraw", href: "/dashboard/withdraw", icon: CreditCard });
  if (features.passbook !== false) navItems.push({ name: "Passbook", href: "/dashboard/transactions", icon: History });
  if (features.referrals !== false) navItems.push({ name: "Referrals", href: "/dashboard/referrals", icon: Users });
  if (features.promos !== false) navItems.push({ name: "Rewards", href: "/dashboard/rewards", icon: Gift });
  if (features.checkin !== false) navItems.push({ name: "Daily Bonus", href: "/dashboard/checkin", icon: CalendarCheck });
  if (features.tasks !== false) navItems.push({ name: "Earn (Tasks)", href: "/dashboard/tasks", icon: ListTodo });
  if (features.leaderboard !== false) navItems.push({ name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy });
  if (features.support !== false) navItems.push({ name: "Support", href: "/dashboard/support", icon: MessageSquare });
  
  navItems.push({ name: "Settings", href: "/dashboard/settings", icon: Settings });

  if (userData?.role === 'admin') {
    navItems.push({ name: "Admin Panel", href: "/admin", icon: ShieldCheck });
  }

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col h-full sticky top-0">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400">
          DailyProfit PK
        </h2>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-800 space-y-2">
        {telegramLink && (
          <a 
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Join Telegram</span>
          </a>
        )}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-red-400 hover:bg-red-400/10 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
