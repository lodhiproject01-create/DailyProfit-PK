package com.dailyprofit.admin;

import android.app.Dialog;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.core.content.res.ResourcesCompat;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.firebase.FirebaseApp;
import com.google.firebase.firestore.DocumentChange;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.ListenerRegistration;

public class MainActivity extends BridgeActivity {
    private ProgressBar progressBar;
    private boolean isInterfaceSetup = false;
    private final String baseUrl = "https://dailyprofitpk.vercel.app/admin";
    private String customUA;
    private FirebaseFirestore db;
    private ListenerRegistration withdrawalListener;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseApp.initializeApp(this);
            }
            db = FirebaseFirestore.getInstance();
            startAutomaticMonitoring();
        } catch (Exception e) {
            e.printStackTrace();
        }

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.BLACK);
    }

    // Real-time Monitoring for automatic updates
    private void startAutomaticMonitoring() {
        if (db == null) return;
        
        // Automatically listen for NEW withdrawal requests
        withdrawalListener = db.collection("withdrawals")
            .whereEqualTo("status", "pending")
            .addSnapshotListener((value, error) -> {
                if (error != null) return;
                if (value != null && !value.isEmpty()) {
                    for (DocumentChange dc : value.getDocumentChanges()) {
                        if (dc.getType() == DocumentChange.Type.ADDED) {
                            Toast.makeText(this, "New Withdrawal Request Received!", Toast.LENGTH_LONG).show();
                        }
                    }
                }
            });
    }

    @Override
    public void onStart() {
        super.onStart();
        if (!isInterfaceSetup) {
            setupAdminUI();
            isInterfaceSetup = true;
        }
    }

    private void setupAdminUI() {
        WebView webView = this.bridge.getWebView();
        if (webView == null) return;

        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setBackgroundColor(Color.BLACK);
        mainLayout.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        RelativeLayout toolbarContainer = new RelativeLayout(this);
        toolbarContainer.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 140));
        toolbarContainer.setBackgroundColor(Color.parseColor("#1A1A1A"));

        TextView titleText = new TextView(this);
        titleText.setText("DAILY PROFIT ADMIN");
        titleText.setTextColor(Color.WHITE);
        titleText.setTextSize(18);
        titleText.setTypeface(null, android.graphics.Typeface.BOLD);
        RelativeLayout.LayoutParams titleParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        titleParams.addRule(RelativeLayout.CENTER_VERTICAL);
        titleParams.leftMargin = 40;
        toolbarContainer.addView(titleText, titleParams);

        ImageButton settingsBtn = new ImageButton(this);
        settingsBtn.setImageResource(android.R.drawable.ic_menu_manage);
        settingsBtn.setBackgroundColor(Color.TRANSPARENT);
        settingsBtn.setColorFilter(Color.WHITE);
        RelativeLayout.LayoutParams btnParams = new RelativeLayout.LayoutParams(100, 100);
        btnParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        btnParams.addRule(RelativeLayout.CENTER_VERTICAL);
        btnParams.rightMargin = 20;
        settingsBtn.setOnClickListener(v -> webView.loadUrl(baseUrl + "/settings"));
        toolbarContainer.addView(settingsBtn, btnParams);

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 8));
        progressBar.setProgressDrawable(ResourcesCompat.getDrawable(getResources(), android.R.drawable.progress_horizontal, null));
        if (progressBar.getProgressDrawable() != null) {
            progressBar.getProgressDrawable().setColorFilter(Color.parseColor("#FF5252"), android.graphics.PorterDuff.Mode.SRC_IN);
        }
        progressBar.setVisibility(View.GONE);

        BottomNavigationView bottomNav = new BottomNavigationView(this);
        bottomNav.setBackgroundColor(Color.parseColor("#1A1A1A"));
        bottomNav.inflateMenu(R.menu.bottom_nav_menu);
        bottomNav.setLabelVisibilityMode(BottomNavigationView.LABEL_VISIBILITY_LABELED);
        
        int[][] states = new int[][] { new int[] { android.R.attr.state_checked }, new int[] {} };
        int[] colors = new int[] { Color.parseColor("#FF5252"), Color.GRAY };
        bottomNav.setItemIconTintList(new android.content.res.ColorStateList(states, colors));
        bottomNav.setItemTextColor(new android.content.res.ColorStateList(states, colors));

        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_dashboard) webView.loadUrl(baseUrl);
            else if (id == R.id.nav_withdrawals) webView.loadUrl(baseUrl + "/withdrawals");
            else if (id == R.id.nav_deposits) webView.loadUrl(baseUrl + "/deposits");
            else if (id == R.id.nav_ads) {
                webView.loadUrl(baseUrl + "/ads");
                Toast.makeText(this, "Opening Ads Manager...", Toast.LENGTH_SHORT).show();
            }
            else if (id == R.id.nav_users) webView.loadUrl(baseUrl + "/users");
            return true;
        });

        if (webView.getParent() != null) {
            ((ViewGroup) webView.getParent()).removeView(webView);
        }
        
        webView.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f));
        webView.setBackgroundColor(Color.BLACK);

        mainLayout.addView(toolbarContainer);
        mainLayout.addView(progressBar);
        mainLayout.addView(webView);
        mainLayout.addView(bottomNav);

        setContentView(mainLayout);
        setupWebViewSettings(webView);
    }

    private void setupWebViewSettings(WebView webView) {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Bridge for automatic sync from Website to Firestore
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void syncUpdate(String collection, String docId, String status) {
                if (db != null) {
                    db.collection(collection).document(docId).update("status", status)
                        .addOnSuccessListener(aVoid -> runOnUiThread(() -> 
                            Toast.makeText(MainActivity.this, "Firestore Updated Automatically!", Toast.LENGTH_SHORT).show()));
                }
            }
        }, "AndroidBridge");

        customUA = settings.getUserAgentString().replace("; wv", "").replace("Version/4.0 ", "") + " DailyProfitAdmin/1.0";
        settings.setUserAgentString(customUA);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setVisibility(newProgress < 100 ? View.VISIBLE : View.GONE);
                progressBar.setProgress(newProgress);
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                WebView newWebView = new WebView(MainActivity.this);
                newWebView.getSettings().setJavaScriptEnabled(true);
                newWebView.getSettings().setSupportMultipleWindows(true);
                newWebView.getSettings().setUserAgentString(customUA);
                final Dialog dialog = new Dialog(MainActivity.this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                dialog.setContentView(newWebView);
                dialog.show();
                newWebView.setWebChromeClient(new WebChromeClient() {
                    @Override public void onCloseWindow(WebView window) { dialog.dismiss(); }
                });
                newWebView.setWebViewClient(new WebViewClient());
                ((WebView.WebViewTransport) resultMsg.obj).setWebView(newWebView);
                resultMsg.sendToTarget();
                return true;
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript("document.body.style.backgroundColor='black'; document.body.style.color='white';", null);
            }
        });
    }

    @Override
    public void onDestroy() {
        if (withdrawalListener != null) withdrawalListener.remove();
        super.onDestroy();
    }
}
