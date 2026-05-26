import "./globals.css";

export const metadata = {
  title: "DailyProfit PK — Daily Earnings Made Simple",
  description: "Pakistan's premier investment platform. Earn daily profits with JazzCash, EasyPaisa, and bank transfers. Secure, transparent, and built for everyone.",
  manifest: "/manifest.json",
  themeColor: "#00FF99",
  appleWebApp: {
    capable: true,
    title: "DailyProfit PK",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "DailyProfit PK",
    description: "Daily Earnings Made Simple",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="DailyProfit PK" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="bg-[#0B0F19] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
