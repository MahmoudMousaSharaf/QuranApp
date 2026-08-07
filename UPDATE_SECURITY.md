# ============================================
# OTA UPDATE SECURITY SYSTEM — COMPLETE GUIDE
# ============================================
#
# App: "The Truth - Al Haq" (Quran App)
# Owner: majmod
# Expo Project ID: 2dbd2e64-7e69-44c1-923c-36c25a11a44d
# GitHub Repo: MahmoudMousaSharaf/QuranApp
#
# ============================================
# WHAT IS THIS FILE?
# ============================================
# This file is the ONLY documentation you need to understand
# how to update the app. Anyone who has this file and understands
# it can push updates. Without this file, updating the app is
# impossible because the security system will reject any
# unsigned or wrongly-signed update.
#
# ============================================
# SECURITY MODEL (SIMPLE EXPLANATION)
# ============================================
#
# Think of it like a locked safe with two keys:
#
# 1. PRIVATE KEY (the "signing key"):
#    - Value: ZAhJJotLzGBZgVm4P6Jyai9sJsLg6HyZ+ellb3vSL3Q=
#    - Stored in: GitHub Secrets (name: UPDATE_CODE_SIGNING_PRIVATE_KEY)
#    - Also stored locally in: .keys/update-key.txt (gitignored, NOT on GitHub)
#    - Purpose: Signs (locks) the update so the app trusts it
#    - WHO CAN USE IT: Only GitHub Actions (automatic) or you (manual)
#    - NEVER put this in code or commit it to GitHub
#
# 2. PUBLIC KEY (the "verification key"):
#    - Same value (HMAC symmetric): ZAhJJotLzGBZgVm4P6Jyai9sJsLg6HyZ+ellb3vSL3Q=
#    - Stored in: keys/update-public-key.pem (committed to repo, safe)
#    - Referenced in: app.json → expo.updates.codeSigningCertificate
#    - Purpose: Verifies (unlocks) the update on user's phone
#    - The app checks: "Was this update signed with the matching private key?"
#    - If NO → update is REJECTED, user keeps old version
#    - If YES → update is installed
#
# 3. EXPO TOKEN:
#    - Value: tm5lez-1VmoMVYZojozkPowSFQFTgQbRoTpNU3WL
#    - Stored in: GitHub Secrets (name: EXPO_TOKEN)
#    - Purpose: Authenticates with Expo servers to push updates
#    - Created at: https://expo.dev/accounts/majmod/settings/access-tokens
#
# ============================================
# HOW UPDATES WORK (STEP BY STEP)
# ============================================
#
# AUTOMATIC (when you push code to GitHub):
# 1. You push code to "main" branch on GitHub
# 2. GitHub Action (.github/workflows/ota-update.yml) runs automatically
# 3. It reads UPDATE_CODE_SIGNING_PRIVATE_KEY from GitHub Secrets
# 4. It reads EXPO_TOKEN from GitHub Secrets
# 5. It runs: eas update --branch production --non-interactive
# 6. EAS signs the update with the private key
# 7. EAS uploads the signed update to Expo servers
# 8. User's phone downloads the update
# 9. App verifies signature with public key (keys/update-public-key.pem)
# 10. If signature matches → update installed on next app restart
#
# MANUAL (from your computer terminal):
# 1. Open terminal in E:\quran-app
# 2. Set token: $env:EXPO_TOKEN="tm5lez-1VmoMVYZojozkPowSFQFTgQbRoTpNU3WL"
# 3. Run: eas update --branch production --message "your update message"
# 4. Update is signed and pushed to Expo servers
#
# ============================================
# WHAT CAN BE UPDATED VIA OTA?
# ============================================
# ✅ JavaScript/TypeScript code changes
# ✅ New screens, UI changes, bug fixes
# ✅ New JSON data files
# ✅ Translation changes
# ✅ Image/asset changes
# ❌ New native modules (requires full store build)
# ❌ New permissions (requires full store build)
# ❌ app.json changes to native config (requires full store build)
#
# ============================================
# FILES INVOLVED IN SECURITY
# ============================================
#
# File                             | Location           | Committed? | Purpose
# ---------------------------------|--------------------|------------|--------
# app.json                         | E:\quran-app\      | YES        | Config with update URL + code signing
# eas.json                         | E:\quran-app\      | YES        | EAS build/update config
# keys/update-public-key.pem       | E:\quran-app\      | YES        | Public key (safe to share)
# .keys/update-key.txt             | E:\quran-app\      | NO         | Private key (gitignored)
# .github/workflows/ota-update.yml | E:\quran-app\      | YES        | GitHub Action for auto updates
# scripts/generate-keys.js         | E:\quran-app\      | YES        | Key generation helper script
# UPDATE_SECURITY.md               | E:\quran-app\      | YES        | This file
#
# ============================================
# GITHUB SECRETS (set and verified)
# ============================================
# 1. UPDATE_CODE_SIGNING_PRIVATE_KEY = ZAhJJotLzGBZgVm4P6Jyai9sJsLg6HyZ+ellb3vSL3Q=
# 2. EXPO_TOKEN = tm5lez-1VmoMVYZojozkPowSFQFTgQbRoTpNU3WL
#
# Both are encrypted in GitHub using libsodium seal encryption.
# They can only be used by GitHub Actions, never seen by anyone.
#
# ============================================
# EXPO PROJECT DETAILS
# ============================================
# Account: majmod
# Project ID: 2dbd2e64-7e69-44c1-923c-36c25a11a44d
# Update URL: https://u.expo.dev/2dbd2e64-7e69-44c1-923c-36c25a11a44d
# Runtime version policy: sdkVersion (updates only between same SDK version)
#
# ============================================
# HOW TO REGENERATE KEYS (IF COMPROMISED)
# ============================================
# 1. Run: node scripts/generate-keys.js
# 2. This generates a NEW random key
# 3. Update GitHub Secret: UPDATE_CODE_SIGNING_PRIVATE_KEY
# 4. Update keys/update-public-key.pem with new key
# 5. Rebuild the app for stores (new public key must be in the build)
# 6. Old key stops working — all future updates need new key
#
# ============================================
# IMPORTANT SECURITY NOTES
# ============================================
# - The private key MUST stay secret. If someone gets it, they can
#   push malicious updates to your users.
# - The public key in the app build CANNOT be changed via OTA.
#   Changing it requires a new store build.
# - Always test updates on "preview" branch before "production".
# - The EXPO_TOKEN can be regenerated at any time from Expo settings.
# - If you revoke the EXPO_TOKEN, automatic updates stop working
#   until you set a new one in GitHub Secrets.
#
# ============================================
# TROUBLESHOOTING
# ============================================
# "Update not showing on phone?"
# → Check GitHub Actions tab for errors
# → Verify both secrets are set in GitHub repo settings
# → Make sure code was pushed to "main" branch
# → Try manual: eas update --branch production --message "test"
#
# "Signature verification failed?"
# → Public key in keys/update-public-key.pem doesn't match
#   the private key in GitHub Secrets
# → Regenerate and re-sync both keys
#
# "GitHub Action fails?"
# → Check EXPO_TOKEN is still valid (not revoked)
# → Check UPDATE_CODE_SIGNING_PRIVATE_KEY is set correctly
# → Look at Action logs in GitHub Actions tab
