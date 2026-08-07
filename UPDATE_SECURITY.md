# ============================================
# OTA Update Security System - Setup Guide
# ============================================
#
# This file documents the complete OTA (Over-The-Air) update system
# for "The Truth - Al Haq" Quran app using Expo EAS Update with
# code signing for security.
#
# --------------------------------------------
# OVERVIEW
# --------------------------------------------
# When the app is published to App Store / Play Store, you can push
# JavaScript bundle updates directly to users WITHOUT going through
# the store review process. This is called an OTA update.
#
# To ensure OTA updates are secure and cannot be tampered with,
# we use Expo's code signing feature. Updates are signed with a
# private key, and the app verifies the signature using the public key
# embedded in the build.
#
# --------------------------------------------
# SECURITY MODEL
# --------------------------------------------
# - PRIVATE KEY: Used to sign updates. Stored as GitHub Secret.
#   NEVER committed to the repo. Only accessible via GitHub Actions.
# - PUBLIC KEY: Embedded in the app build. Used to verify updates.
#   Safe to include in the repo.
# - EXPO_TOKEN: Used by GitHub Actions to authenticate with EAS.
#   Stored as GitHub Secret.
#
# --------------------------------------------
# STEP-BY-STEP SETUP (ONE TIME ONLY)
# --------------------------------------------
#
# 1. Install EAS CLI (if not already):
#    npm install -g eas-cli
#
# 2. Log in to Expo:
#    eas login
#
# 3. Generate code signing key pair:
#    eas update:secret:create
#    - Name: UPDATE_CODE_SIGNING_PRIVATE_KEY
#    - Type: base64
#    - Value: Run this command to generate:
#      openssl rand -base64 32
#      (Save the output - this is your PRIVATE KEY)
#
# 4. Generate the public key from the private key:
#    eas update:secret:create
#    - Name: UPDATE_CODE_SIGNING_PUBLIC_KEY
#    - Type: base64
#    - Value: Run this command:
#      echo -n "YOUR_PRIVATE_KEY_BASE64" | base64 -d | openssl pkey -pubout 2>/dev/null | base64
#      (Or use the script: node scripts/generate-keys.js)
#
# 5. Add the public key to app.json under expo.updates.codeSigningCertificate
#    (See app.json for the configured path)
#
# 6. Set up GitHub Secrets (repo Settings > Secrets and variables > Actions):
#    - EXPO_TOKEN: Your Expo access token (from https://expo.dev/accounts/[user]/settings/access-tokens)
#    - UPDATE_CODE_SIGNING_PRIVATE_KEY: The base64 private key from step 3
#
# 7. Link the project to EAS:
#    eas init
#    (This sets the projectId in app.json extra.eas.projectId)
#
# --------------------------------------------
# HOW TO PUSH AN UPDATE
# --------------------------------------------
#
# Method 1: Automatic via GitHub (Recommended)
# - Push code to the "main" branch on GitHub
# - The GitHub Action (.github/workflows/ota-update.yml) automatically:
#   a. Checks out the code
#   b. Installs dependencies
#   c. Runs eas update --branch production --message "..."
#   d. Signs the update with the private key from GitHub Secrets
# - Users get the update next time they open the app
#
# Method 2: Manual from terminal
# - Run: eas update --branch production --message "Your update message"
# - Requires EXPO_PRIVATE_KEY env var to be set
#
# --------------------------------------------
# HOW THE APP CHECKS FOR UPDATES
# --------------------------------------------
# The app is configured to:
# 1. Check for updates on app launch
# 2. Download the update in the background
# 3. Apply the update on next app restart
# 4. Verify the update signature using the embedded public key
# If signature verification fails, the update is rejected.
#
# --------------------------------------------
# FILES INVOLVED
# --------------------------------------------
# - app.json: Contains expo-updates config with code signing
# - eas.json: Contains EAS build and update configuration
# - .github/workflows/ota-update.yml: GitHub Action for automatic updates
# - scripts/generate-keys.js: Helper script to generate key pair
# - UPDATE_SECURITY.md: This file
# - PROGRESS.md: Overall progress tracking
# - TASK_TRACKER.md: Task tracking
#
# --------------------------------------------
# IMPORTANT NOTES
# --------------------------------------------
# - OTA updates only work for JavaScript/asset changes.
#   Native code changes (new permissions, new native modules) require
#   a full store build and store review.
# - The private key MUST remain secret. If compromised, generate a new
#   key pair and publish a new store build with the new public key.
# - Always test updates with the "preview" branch before pushing to "production".
# - The projectId in app.json must be set after running `eas init`.
