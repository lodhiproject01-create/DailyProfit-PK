package com.dailyprofit.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Handle the splash screen transition.
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    public void onStart() {
        super.onStart();
        
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable all necessary features for Firebase/Modern Web Apps
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setSupportMultipleWindows(true);
            settings.setAllowContentAccess(true);
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);
            
            // Fix for Firebase Auth redirects/popups in some cases
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Enable Cookies and Persistence
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            // Enable password and form data saving
            settings.setSavePassword(true);
            settings.setSaveFormData(true);

            // Custom UserAgent
            settings.setUserAgentString(settings.getUserAgentString() + " DailyProfitApp/1.0");

            // Remote Debugging (Allows debugging via chrome://inspect)
            if (0 != (getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)) {
                WebView.setWebContentsDebuggingEnabled(true);
            }
        }

        // Inject CSS and Secret Admin Entrance
        this.bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                String js = """
                    (function() {
                      // Fix Button Positions
                      var style = document.createElement('style');
                      style.innerHTML = '.fixed.bottom-6.right-4 { bottom: 6.5rem !important; }';
                      style.innerHTML += ' .fixed.bottom-24.right-4 { bottom: 8.5rem !important; }';
                      document.head.appendChild(style);
                      
                      // Secret Entrance: Clicking App Name/Logo 5 times redirects to Admin Login
                      var adminTrigger = document.querySelector('nav div') || document.querySelector('h1') || document.body;
                      var clickCount = 0;
                      if(adminTrigger) {
                        adminTrigger.addEventListener('click', function() {
                          clickCount++;
                          if(clickCount >= 5) { window.location.href = '/admin-login'; }
                        });
                      }
                    })();
                    """;
                webView.evaluateJavascript(js, null);
            }
        });
    }
}
