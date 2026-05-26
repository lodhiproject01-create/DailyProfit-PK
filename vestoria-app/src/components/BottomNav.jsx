"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ArrowDownToLine, Users, Settings, ShieldCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { db } from "@/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

export default function BottomNav() {
  const pathname = usePathname();
  const { userData } = useStore();

  const [features, setFeatures] = useState({ investments: true, deposit: true, referrals: true });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().features) setFeatures(docSnap.data().features);
    });
    return () => unsub();
  }, []);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (features.investments !== false) navItems.push({ name: "Plans", href: "/dashboard/investments", icon: Wallet });
  if (features.deposit !== false) navItems.push({ name: "Deposit", href: "/dashboard/deposit", icon: ArrowDownToLine });
  if (features.referrals !== false) navItems.push({ name: "Team", href: "/dashboard/referrals", icon: Users });

  navItems.push({ name: "Settings", href: "/dashboard/settings", icon: Settings });

  if (userData?.role === 'admin') {
    navItems.push({ name: "Admin", href: "/admin", icon: ShieldCheck });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe z-40">
      <div className="flex justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-white'}`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
