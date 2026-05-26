$token = "vcp_19PwGH55BjfUrsEE6cW4CQzeX6uDQGpltC9pteMu5PnXOuMfWD4cf7RZ"
Write-Output "AIzaSyDXWwvaobUr5vJLUfp-r0GxipdzcmFOjNs" | npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production --token $token --yes
Write-Output "dailyprofitpk-01.firebaseapp.com" | npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production --token $token --yes
Write-Output "https://dailyprofitpk-01-default-rtdb.firebaseio.com" | npx vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL production --token $token --yes
Write-Output "dailyprofitpk-01" | npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production --token $token --yes
Write-Output "dailyprofitpk-01.firebasestorage.app" | npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production --token $token --yes
Write-Output "471340210455" | npx vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production --token $token --yes
Write-Output "1:471340210455:web:cfec53a7c25e45c24c3f52" | npx vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production --token $token --yes
Write-Output "G-LLPM9WTYJ1" | npx vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production --token $token --yes
Write-Output "umarlodhi2020@gmail.com,umarhayat@gmail.com,admin@dailyprofit.pk" | npx vercel env add NEXT_PUBLIC_ADMIN_EMAILS production --token $token --yes

