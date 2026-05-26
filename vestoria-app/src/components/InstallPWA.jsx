"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [appLink, setAppLink] = useState("");

  useEffect(() => {
    // Detect if already running in standalone PWA, Capacitor, or Android WebView
    const isStandalone = 
      (typeof window !== "undefined" && window.matchMedia('(display-mode: standalone)').matches) 
      || (typeof navigator !== "undefined" && navigator.standalone)
      || typeof window.Capacitor !== 'undefined'
      || /wv|android.*wv/i.test(navigator.userAgent);

    if (isStandalone) {
      setShowInstall(false);
      return;
    }

    // Check if persistently dismissed via localStorage
    const dismissed = localStorage.getItem("appPopupDismissed_v4");
    
    // Show if not persistently dismissed
    if (!dismissed) {
      setShowInstall(true);
    }
    
    // Fetch settings for App Link
    getDoc(doc(db, "settings", "general")).then((snap) => {
      if (snap.exists() && snap.data().appLink) {
        setAppLink(snap.data().appLink);
      }
    }).catch(err => {
      console.error("Error loading appLink settings:", err);
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed && !isStandalone) setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);
 
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstall(false);
        localStorage.setItem("appPopupDismissed_v4", "true");
      }
    } else {
      alert("To install: Tap the browser menu (⋮) and select 'Add to Home Screen'");
    }
  };
 
  const handleDismiss = () => {
    setShowInstall(false);
    localStorage.setItem("appPopupDismissed_v4", "true");
  };
 
  if (!showInstall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-700 shadow-2xl rounded-3xl p-6 md:p-8 w-full max-w-sm relative text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-800 hover:text-white rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
          <Smartphone className="w-10 h-10 text-gray-900" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Get the Official App</h3>
        <p className="text-gray-400 text-sm mb-8">
          Experience faster speeds, push notifications, and a smoother interface by downloading our official Android app!
        </p>
        
        <div className="w-full flex flex-col gap-3">
          {(appLink || "/DailyProfitPK.apk") && (() => {
            let downloadUrl = appLink || "/DailyProfitPK.apk";

            // Convert Google Drive share link to direct download link
            // e.g. https://drive.google.com/file/d/FILE_ID/view  → https://drive.google.com/uc?export=download&id=FILE_ID
            const driveMatch = downloadUrl.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
            if (driveMatch) {
              downloadUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
            }

            return (
              <a
                href={downloadUrl}
                download="DailyProfitPK.apk"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  localStorage.setItem("appPopupDismissed_v4", "true");
                  handleDismiss();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-cyan-500 hover:brightness-110 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 transition text-center justify-center"
              >
                <Download className="w-5 h-5" /> Download APK Now
              </a>
            );
          })()}
          
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick} 
              className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-medium border border-gray-700 rounded-xl transition"
            >
              Add to Home Screen (PWA)
            </button>
          )}
          
          <button 
            onClick={handleDismiss}
            className="w-full py-2 text-gray-500 hover:text-white text-sm font-medium transition mt-2"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
