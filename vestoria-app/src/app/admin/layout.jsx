"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { 
  LayoutDashboard, Users, ArrowDownToLine, CreditCard, 
  Package, ShieldAlert, Settings, LogOut, Menu, X, Bell, Search, MessageSquare, Zap, Gift, ListTodo, Megaphone, ShieldCheck, Database, Send, Image as ImageIcon
} from "lucide-react";

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.push("/admin-login");
        return;
      }
      
      try {
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && ["admin", "superadmin", "manager"].includes(userSnap.data().role)) {
          setIsAdmin(true);
          const data = userSnap.data();
          setAdminData(data);
          localStorage.setItem(`dppk_user_role_${u.uid}`, data.role || "admin");
        } else {
          alert("Unauthorized access. Admin only.");
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "User Management", path: "/admin/users", icon: Users },
    { name: "Deposits", path: "/admin/deposits", icon: ArrowDownToLine },
    { name: "Withdrawals", path: "/admin/withdrawals", icon: CreditCard },
    { name: "Investment Plans", path: "/admin/plans", icon: Package },
    { name: "Fraud & Risk", path: "/admin/fraud", icon: ShieldAlert },
    { name: "Global Notices", path: "/admin/notices", icon: Bell },
    { name: "Support Tickets", path: "/admin/tickets", icon: MessageSquare },
    { name: "Database Export", path: "/admin/export", icon: Database },
    { name: "Task Center", path: "/admin/tasks", icon: ListTodo },
    { name: "Automations", path: "/admin/automations", icon: Zap },
    { name: "Mass Broadcast", path: "/admin/broadcast", icon: Send },
    { name: "Promo Codes", path: "/admin/promos", icon: Gift },
    { name: "Promotional Banners", path: "/admin/banners", icon: ImageIcon },
    { name: "Marketing (Fake)", path: "/admin/marketing", icon: Megaphone },
    { name: "Payment Settings", path: "/admin/payments", icon: CreditCard },
    { name: "System Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">DPPK Admin</h1>
              <p className="text-[10px] text-green-400 font-mono tracking-widest uppercase">{adminData?.role || "ADMIN"}</p>
            </div>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                  ${isActive 
                    ? "bg-gradient-to-r from-green-500/10 to-cyan-500/10 text-green-400 border border-green-500/20" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : ""}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition font-medium"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-20 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center bg-gray-800 border border-gray-700 rounded-full px-4 py-2 w-64 focus-within:border-green-500/50 transition">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search user ID or email..." className="bg-transparent border-none outline-none text-sm text-white w-full ml-2 placeholder-gray-500" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-gray-900" />
            </button>
            <div className="h-8 w-px bg-gray-700 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{adminData?.name || "Admin"}</p>
                <p className="text-xs text-gray-400">{adminData?.email}</p>
              </div>
              <div className="w-10 h-10 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center font-bold text-green-400">
                {(adminData?.name || "A").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#0B0F19]">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
