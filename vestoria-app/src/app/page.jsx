"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  TrendingUp, Shield, Zap, Users, ChevronDown, ChevronUp,
  CheckCircle2, ArrowRight, Star, Lock
} from "lucide-react";

const plans = [
  { name: "Starter", price: 1000, daily: 50, days: 30, color: "from-green-500 to-cyan-500", popular: false },
  { name: "Pro", price: 5000, daily: 300, days: 30, color: "from-purple-500 to-blue-500", popular: true },
  { name: "Elite", price: 10000, daily: 700, days: 30, color: "from-orange-500 to-red-500", popular: false },
];

const faqs = [
  { q: "How do I start investing?", a: "Sign up, deposit funds to your Main Balance, then select an investment plan from the Dashboard. Your daily profits start immediately after admin approval." },
  { q: "How are profits calculated?", a: "Each plan has a fixed daily profit. For example, the Starter Plan gives Rs. 50/day on a Rs. 1,000 investment for 30 days = Rs. 1,500 total return." },
  { q: "How do I withdraw earnings?", a: "Go to Dashboard → Withdraw. Withdrawals are processed from your Profit Wallet. Minimum withdrawal is Rs. 500. Admin processes within 24 hours." },
  { q: "Is my investment safe?", a: "Yes. Your capital is securely managed. We use Firebase with multi-layer security and all transactions require admin verification." },
  { q: "How does the referral system work?", a: "Share your unique referral link. When someone signs up and makes their first deposit, you earn 10% commission — instantly credited to your Main Balance." },
];

import { db } from "@/firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);
  const [recentPayouts, setRecentPayouts] = useState([]);

  // Fetch recent approved withdrawals and fake payouts
  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        // 1. Get real payouts
        const q1 = query(collection(db, "withdrawals"), where("status", "==", "approved"));
        const snap1 = await getDocs(q1);
        const realData = snap1.docs.map(d => d.data());

        // 2. Get fake payouts
        const snap2 = await getDocs(collection(db, "fakePayouts"));
        const fakeData = snap2.docs.map(d => d.data());

        // Combine and sort
        const combined = [...realData, ...fakeData];
        combined.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        
        setRecentPayouts(combined.slice(0, 15)); // Top 15 recent
      } catch (err) {
        console.log(err);
      }
    };
    fetchPayouts();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0B0F19]/80 backdrop-blur border-b border-gray-800 px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gray-900" />
          </div>
          <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400">
            DailyProfit PK
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-gray-300 hover:text-white text-sm font-medium transition">Login</Link>
          <Link href="/login" className="bg-gradient-to-r from-green-500 to-cyan-500 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm hover:brightness-110 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 md:px-8 pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold px-4 py-2 rounded-full mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Now Live — Start Earning Daily
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-white">Daily Earnings</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400">
              Made Simple
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Pakistan's premium investment platform. Invest once, earn daily profits automatically.
            Secure, transparent, and built for everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="bg-gradient-to-r from-green-500 to-cyan-500 hover:brightness-110 text-gray-900 font-bold px-8 py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/20">
              Start Earning Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#plans" className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition border border-gray-700">
              View Plans
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto">
            {[
              { value: "500+", label: "Active Investors" },
              { value: "Rs. 2M+", label: "Total Paid Out" },
              { value: "99.9%", label: "Uptime" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-gray-500 text-xs md:text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Payouts Ticker */}
      {recentPayouts.length > 0 && (
        <div className="w-full bg-green-500/10 border-y border-green-500/20 py-3 overflow-hidden flex items-center relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0B0F19] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0B0F19] to-transparent z-10" />
          
          <div className="flex animate-ticker gap-8 whitespace-nowrap min-w-full pl-8">
            {/* Double the array for seamless scrolling */}
            {[...recentPayouts, ...recentPayouts].map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">
                  <span className="font-bold text-white">{p.email ? p.email.split('@')[0] : 'User'}</span> just withdrew 
                  <span className="text-green-400 font-bold ml-1">Rs. {p.amount}</span>
                </span>
                <span className="text-gray-600 text-xs ml-2 text-center">•</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <section className="px-4 md:px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">Why Choose Us?</h2>
        <p className="text-gray-400 text-center mb-12">Built for Pakistani investors. Secure, simple, and rewarding.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: TrendingUp, title: "Daily Profits", desc: "Earn fixed daily returns automatically credited to your account.", color: "text-green-400", bg: "bg-green-500/10" },
            { icon: Shield, title: "Fully Secure", desc: "Firebase-backed security with admin-verified every transaction.", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: Zap, title: "Instant Setup", desc: "Sign up and start investing in under 2 minutes.", color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { icon: Users, title: "Referral Rewards", desc: "Earn 10% commission on every friend's first deposit.", color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((f, i) => (
            <div key={i} className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition group">
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="px-4 md:px-8 py-20 bg-gray-900/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">Investment Plans</h2>
          <p className="text-gray-400 text-center mb-12">Choose your plan and start earning daily.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`relative bg-gray-800 border rounded-3xl overflow-hidden flex flex-col ${plan.popular ? "border-cyan-500/50 shadow-lg shadow-cyan-500/10" : "border-gray-700"}`}>
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> POPULAR
                  </div>
                )}
                <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-1">{plan.name} Plan</h3>
                  <p className="text-4xl font-extrabold mb-6">Rs. {plan.price.toLocaleString()}</p>
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex justify-between bg-gray-900 p-3 rounded-xl">
                      <span className="text-gray-400 text-sm">Daily Profit</span>
                      <span className="text-green-400 font-bold">Rs. {plan.daily}</span>
                    </div>
                    <div className="flex justify-between bg-gray-900 p-3 rounded-xl">
                      <span className="text-gray-400 text-sm">Duration</span>
                      <span className="font-bold">{plan.days} Days</span>
                    </div>
                    <div className="flex justify-between bg-gray-900 p-3 rounded-xl">
                      <span className="text-gray-400 text-sm">Total Return</span>
                      <span className="text-cyan-400 font-bold">Rs. {(plan.daily * plan.days).toLocaleString()}</span>
                    </div>
                  </div>
                  <Link href="/login" className={`w-full py-3 rounded-xl font-bold text-center bg-gradient-to-r ${plan.color} text-white hover:brightness-110 transition`}>
                    Invest Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 md:px-8 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">How It Works</h2>
        <p className="text-gray-400 mb-12">Three simple steps to start earning.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Create Account", desc: "Sign up with your email in under a minute. No documents needed.", icon: "✍️" },
            { step: "02", title: "Deposit Funds", desc: "Send money via JazzCash, EasyPaisa, or Bank. Upload screenshot for verification.", icon: "💳" },
            { step: "03", title: "Earn Daily", desc: "Choose a plan. Your profits are calculated and credited every single day.", icon: "📈" },
          ].map((s, i) => (
            <div key={i} className="relative">
              <div className="text-5xl mb-4">{s.icon}</div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 bg-gray-800 border border-gray-700 text-gray-500 text-xs font-bold px-2 py-0.5 rounded">
                STEP {s.step}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 mt-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-8 py-20 bg-gray-900/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">FAQs</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left"
                >
                  <span className="font-bold text-white pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-700 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 md:px-8 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Start Earning?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">Join thousands of Pakistani investors already earning daily profits on DailyProfit PK.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="bg-gradient-to-r from-green-500 to-cyan-500 text-gray-900 font-bold px-8 py-4 rounded-2xl hover:brightness-110 transition flex items-center justify-center gap-2">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> 100% Secure</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Free to Join</span>
            <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Instant Profits</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 md:px-8 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-gray-900" />
          </div>
          <span className="font-bold text-white">DailyProfit PK</span>
        </div>
        <p>© 2025 DailyProfit PK. Daily Earnings Made Simple.</p>
        <div className="flex justify-center gap-4 mt-3 text-xs">
          <a href="#" className="hover:text-gray-300 transition">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300 transition">Terms & Conditions</a>
          <a href="#" className="hover:text-gray-300 transition">Contact</a>
        </div>
      </footer>
    </div>
  );
}
