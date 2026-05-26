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

    return new Response(JSON.stringify({ 
      success: true, 
      message: "🚀 Firestore database successfully initialized with Dynamic Settings, Premium Investment Plans, and Dynamic Billing Gateways!"
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
