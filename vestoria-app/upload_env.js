const { execSync } = require('child_process');

const token = "vcp_19PwGH55BjfUrsEE6cW4CQzeX6uDQGpltC9pteMu5PnXOuMfWD4cf7RZ";

const envs = {
  "NEXT_PUBLIC_FIREBASE_API_KEY": "AIzaSyDXWwvaobUr5vJLUfp-r0GxipdzcmFOjNs",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "dailyprofitpk-01.firebaseapp.com",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL": "https://dailyprofitpk-01-default-rtdb.firebaseio.com",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "dailyprofitpk-01",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET": "dailyprofitpk-01.firebasestorage.app",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "471340210455",
  "NEXT_PUBLIC_FIREBASE_APP_ID": "1:471340210455:web:cfec53a7c25e45c24c3f52",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID": "G-LLPM9WTYJ1",
  "NEXT_PUBLIC_ADMIN_EMAILS": "umarlodhi2020@gmail.com,umarhayat@gmail.com,admin@dailyprofit.pk"
};

for (const [key, value] of Object.entries(envs)) {
  console.log(`Adding ${key}...`);
  try {
    // We echo the value and pipe it to vercel env add
    execSync(`echo ${value} | npx vercel env add ${key} production --token ${token} --yes`, { stdio: 'inherit', shell: 'powershell.exe' });
  } catch (err) {
    console.error(`Error adding ${key}`, err.message);
  }
}
console.log("Done adding env variables.");
