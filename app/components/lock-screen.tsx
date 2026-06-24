"use client";

import { useState } from "react";
import { useVaultStore } from "@/store/vault-store";
import {
  getPasswordStrength,
  getPasswordStrengthColor,
} from "@/lib/password-strength";

type LockScreenProps = {
  mode: "setup" | "unlock";
};

export default function LockScreen({ mode }: LockScreenProps) {
  const { createMasterPassword, unlockVault } = useVaultStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSetup = mode === "setup";
  const strength = getPasswordStrength(password);
  const strengthColor = getPasswordStrengthColor(strength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Password cannot be empty.");
      return;
    }

    if (isSetup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSetup) {
        await createMasterPassword(password);
      } else {
        const success = await unlockVault(password);

        if (!success) {
          setError("Incorrect master password.");
        }
      }

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Lock screen error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Vault</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSetup
              ? "Create your master password to secure the vault."
              : "Enter your master password to unlock the vault."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-sky-500"
              placeholder="Enter master password"
            />
          </div>

          {isSetup && password && (
            <p className="text-sm font-medium" style={{ color: strengthColor }}>
              Password strength: {strength}
            </p>
          )}

          {isSetup && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-sky-500"
                placeholder="Confirm master password"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isSetup
              ? "Create Password"
              : "Unlock Vault"}
          </button>
        </form>
      </div>
    </div>
  );
}
