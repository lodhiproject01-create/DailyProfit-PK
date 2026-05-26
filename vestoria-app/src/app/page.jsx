"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Instant check using cached user role from localStorage
        const cachedRole = localStorage.getItem(`dppk_user_role_${user.uid}`);
        if (cachedRole) {
          if (["admin", "superadmin", "manager"].includes(cachedRole)) {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
        } else {
          // Fallback to Firestore if no cache exists
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role || "user";
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
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0B0F19]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
    </div>
  );
}
