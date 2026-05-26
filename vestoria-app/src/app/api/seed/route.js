import { db } from "@/firebase/config";
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

export async function GET() {
  try {
    // 1. Seed Dynamic Settings (settings/general)
    await setDoc(doc(db, "settings", "general"), {
      maintenance: false,
      minWithdrawal: 500,
      maxWithdrawal: 25000,
      withdrawalFeePct: 10,
      requireReferralsForWithdraw: true,
      withdrawalProcessingTime: "24 Hours",
      withdrawalInstructions: "Please double check your account title and number. Wrong entries cannot be reversed. Processing takes up to 24 hours.",
      referralBonusPct: 10
    });

    // 2. Seed Default Plans
    const plans = [
      { id: "starter", name: "Starter Plan", price: 1000, dailyProfit: 50, durationDays: 30, color: "from-green-500 to-cyan-500" },
      { id: "pro", name: "Pro Plan", price: 5000, dailyProfit: 300, durationDays: 30, color: "from-purple-500 to-blue-500" },
      { id: "elite", name: "Elite Plan", price: 10000, dailyProfit: 700, durationDays: 30, color: "from-orange-500 to-red-500" },
      { id: "vip", name: "VIP Platinum Plan", price: 25000, dailyProfit: 2000, durationDays: 35, color: "from-pink-500 to-rose-500" },
      { id: "diamond", name: "Diamond Master Plan", price: 50000, dailyProfit: 4500, durationDays: 40, color: "from-yellow-400 to-amber-600" }
    ];

    for (const plan of plans) {
      await setDoc(doc(db, "plans", plan.id), plan);
    }

    // 3. Seed Default Payment Methods
    const paymentMethods = [
      {
        id: "jazzcash",
        name: "JazzCash",
        logo: "📱",
        title: "Ali Hassan",
        number: "03046200257",
        minDeposit: 100,
        maxDeposit: 50000,
        instructions: "Send JazzCash funds directly to this mobile account. Verify title is Ali Hassan before sending.",
        status: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: "easypaisa",
        name: "EasyPaisa",
        logo: "💚",
        title: "Ali Hassan",
        number: "03046200257",
        minDeposit: 100,
        maxDeposit: 50000,
        instructions: "Transfer EasyPaisa funds directly. Verify title is Ali Hassan before confirming.",
        status: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: "bank",
        name: "Bank Transfer",
        logo: "🏦",
        title: "DailyProfit PK Private Ltd",
        number: "010203040506",
        iban: "PK73MEZN001234567890",
        minDeposit: 1000,
        maxDeposit: 500000,
        instructions: "Transfer via any Bank app using IBAN. Add reference/note DailyProfit.",
        status: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: "usdt",
        name: "USDT TRC20",
        logo: "🪙",
        title: "TRC20 Wallet Address",
        number: "TX123abc456def789ghiJklMnoPqrStuVw",
        minDeposit: 5,
        maxDeposit: 10000,
        instructions: "Transfer USDT to this TRC20 address only. Standard block verification time applies.",
        status: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: "binance",
        name: "Binance Pay",
        logo: "🟡",
        title: "Binance Pay ID",
        number: "471340210",
        minDeposit: 5,
        maxDeposit: 10000,
        instructions: "Transfer using Binance Pay ID directly. Fast approval.",
        status: true,
        updatedAt: new Date().toISOString()
      }
    ];

    for (const method of paymentMethods) {
      await setDoc(doc(db, "payment_methods", method.id), method);
    }

    // 4. Seed Default Tasks (Watch & Earn)
    const tasks = [
      { id: "task-1", title: "Subscribe to our official YouTube Channel", link: "https://youtube.com", reward: 25, active: true, createdAt: new Date() },
      { id: "task-2", title: "Join our active Telegram channel", link: "https://telegram.org", reward: 30, active: true, createdAt: new Date() },
      { id: "task-3", title: "Follow our official Twitter page", link: "https://twitter.com", reward: 20, active: true, createdAt: new Date() }
    ];

    for (const t of tasks) {
      await setDoc(doc(db, "tasks", t.id), t);
    }

    // 5. Seed Default Notices
    await setDoc(doc(db, "notices", "welcome-notice"), {
      title: "Welcome to DailyProfit PK! 🚀",
      message: "Start building consistent daily earnings today. Browse our Premium Investment Plans, complete tasks, and withdraw your profits instantly via EasyPaisa & JazzCash!",
      type: "success",
      active: true,
      timestamp: new Date()
    });

    // 6. Seed Default Promotional Banner
    await setDoc(doc(db, "banners", "launch-banner"), {
      imageUrl: "https://res.cloudinary.com/demo/image/upload/c_fill,w_800,h_300/sample.jpg",
      targetUrl: "/dashboard/investments",
      createdAt: new Date()
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "🚀 Firestore database successfully initialized with Settings, Plans, Billing Gateways, Default Tasks, Notices, and Promotion Banners!"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Seeding error: ", err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
