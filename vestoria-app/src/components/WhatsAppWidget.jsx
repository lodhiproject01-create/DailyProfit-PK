"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, CreditCard, ShieldAlert, Users, Wrench } from "lucide-react";
import { useStore } from "@/store/useStore";
import { usePathname } from "next/navigation";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const { userData } = useStore();
  const pathname = usePathname();

  const [waNumber, setWaNumber] = useState("923000000000");

  useEffect(() => {
    import("firebase/firestore").then(({ doc, getDoc }) => {
      import("@/firebase/config").then(({ db }) => {
        getDoc(doc(db, "settings", "general")).then(snap => {
          if (snap.exists() && snap.data().whatsapp) {
            setWaNumber(snap.data().whatsapp);
          }
        });
      });
    });
  }, []);

  const handleSupport = (category) => {
    setIssueType(category);
    
    // Generate smart support message
    let message = `*DailyProfit PK Support Request*\n\n`;
    message += `*Category:* ${category}\n`;
    if (userData) {
      message += `*User:* ${userData.name || 'N/A'}\n`;
      message += `*Email:* ${userData.email || 'N/A'}\n`;
      message += `*Main Balance:* Rs. ${userData.balance || 0}\n`;
    }
    message += `*Current Page:* ${pathname}\n\n`;
    message += `*Message:* Please describe your issue below...\n`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-36 right-4 md:right-8 z-50 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 relative">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Live Support
              </h3>
              <p className="text-green-100 text-xs mt-1">We typically reply in 5 minutes</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 p-1 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 bg-gray-800 space-y-2">
              <p className="text-sm text-gray-300 mb-3">Hi! What do you need help with?</p>
              
              <button onClick={() => handleSupport('Deposit/Withdrawal')} className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 rounded-xl transition border border-gray-700 text-left text-sm text-gray-200">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                Deposit / Withdrawal Issue
              </button>
              
              <button onClick={() => handleSupport('Verification')} className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 rounded-xl transition border border-gray-700 text-left text-sm text-gray-200">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                Account Verification
              </button>
              
              <button onClick={() => handleSupport('Referrals')} className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 rounded-xl transition border border-gray-700 text-left text-sm text-gray-200">
                <Users className="w-4 h-4 text-green-400" />
                Referral Problem
              </button>
              
              <button onClick={() => handleSupport('Technical')} className="w-full flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-700 rounded-xl transition border border-gray-700 text-left text-sm text-gray-200">
                <Wrench className="w-4 h-4 text-orange-400" />
                Technical Bug
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 md:right-8 z-50 w-14 h-14 bg-gradient-to-tr from-green-600 to-green-400 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-110 transition-transform duration-300"
      >
        <span className="absolute w-full h-full rounded-full border border-green-400/50 animate-ping opacity-75"></span>
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
