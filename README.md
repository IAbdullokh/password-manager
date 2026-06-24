# 🔒 AegisTeam — Secure Team Password Manager

A secure, enterprise-grade team password manager built to replace insecure credential sharing over Telegram, notes, and reused passwords. Designed with an intuitive, trust-inducing UI, this application ensures company credentials remain encrypted, organized, and strictly controlled.

## ✨ Features Implemented

### Part 1 — Vault & Core Features
*   **Zero-Knowledge Master Lock:** The entire vault is encrypted and locked by default on load. It requires the master password to derive the decryption key.
*   **End-to-End Encryption:** Credentials are encrypted using industry-standard algorithms (e.g., AES-GCM or your chosen library). Plain text passwords never touch unencrypted persistent storage.
*   **Rich Credential Metadata:** Each entry securely tracks the Service Name, URL, Username, Password, and optional Notes.
*   **Smart Categorization:** Group and filter credentials instantly by department (e.g., Marketing, Engineering), project, or custom tags.
*   **Configurable Password Generator:** Built-in tool allowing one-click copy, configurable length, and toggles for uppercase letters, numbers, and special symbols.
*   **Security Auditing:** 
    *   **Password Strength Indicator:** Real-time feedback (Weak, Fair, Strong).
    *   **Reuse Detection:** Visual warnings and alerts if a password is duplicated across multiple company accounts.
*   **One-Click Copy:** Fast, seamless clipboard copy actions for usernames and passwords without exposing the plain text on-screen.
*   **Data Export:** Secure, authenticated JSON/CSV vault backup download.

### Part 2 — Interface & Experience (Multi-Page Flow)
1.  **Lock Screen:** A beautiful, secure gateway that serves as the mandatory application entry point.
2.  **Vault Overview:** A high-fidelity dashboard featuring rapid real-time search, category filtering, and clean data layouts.
3.  **Add/Edit Form:** An optimized, sleek form interface designed for quick data entry.
4.  **Settings Panel:** Dedicated workspace to update the master password, manage export features, and set preferences.
*   **Onboarding & Empty States:** Seamless first-time user initialization wizard combined with friendly empty-state views that guide users toward adding their first credential.

### 🌟 Plus One Extra Feature: Audit Log & Activity Trail
*   **What it is:** A local, immutable chronological log tracking sensitive actions (e.g., "Credential Generated," "Vault Exported," "Password Copied").
*   **Why it matters for teams:** In a corporate setting, accountability is everything. This gives managers high-level visibility into security events without compromising the encryption itself.


## 📦 Installation & Local Setup

1. **Clone the repository:**
```bash
   git clone [https://github.com/iabdullokh/password-manager.git]
