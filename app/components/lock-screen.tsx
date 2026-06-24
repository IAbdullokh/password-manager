"use client";

import { useMemo, useState } from "react";
import { useVaultStore } from "@/store/vault-store";

type LockScreenProps = {
  mode: "setup" | "unlock";
};

function getPasswordStrength(password: string): "weak" | "fair" | "strong" {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return "weak";
  if (score <= 4) return "fair";
  return "strong";
}

function getStrengthUi(strength: "weak" | "fair" | "strong") {
  if (strength === "weak") {
    return {
      label: "Weak",
      text: "text-red-400",
      bar: "bg-red-500 w-1/3",
    };
  }

  if (strength === "fair") {
    return {
      label: "Fair",
      text: "text-yellow-400",
      bar: "bg-yellow-500 w-2/3",
    };
  }

  return {
    label: "Strong",
    text: "text-emerald-400",
    bar: "bg-emerald-500 w-full",
  };
}

export default function LockScreen({ mode }: LockScreenProps) {
  const createMasterPassword = useVaultStore(
    (state) => state.createMasterPassword
  );
  const unlockVault = useVaultStore((state) => state.unlockVault);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSetup = mode === "setup";
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );
  const strengthUi = getStrengthUi(passwordStrength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Master password cannot be empty.");
      return;
    }

    if (isSetup) {
      if (password.length < 8) {
        setError("Master password must be at least 8 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      if (isSetup) {
        await createMasterPassword(password);
      } else {
        const success = await unlockVault(password);

        if (!success) {
          setError("Incorrect master password.");
          return;
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl">
          <div className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Team Vault
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            Company credentials, protected behind one secure vault.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Store shared logins for internal tools, cloud platforms, social
            accounts, and project systems in one place. Keep passwords encrypted,
            copy access quickly, and reduce unsafe sharing across chats and notes.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">Encrypted storage</p>
              <p className="mt-2 text-sm text-slate-400">
                Passwords stay protected inside the vault.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">Quick access</p>
              <p className="mt-2 text-sm text-slate-400">
                Copy usernames and passwords without exposing them on screen.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">Team safety</p>
              <p className="mt-2 text-sm text-slate-400">
                Spot reused passwords and keep company accounts better secured.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold">
              {isSetup ? "Create your vault" : "Unlock vault"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isSetup
                ? "Set a master password to secure the vault before adding company credentials."
                : "Enter your master password to unlock saved company credentials."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Master Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                placeholder={
                  isSetup ? "Create a strong master password" : "Enter master password"
                }
              />
            </div>

            {isSetup && password && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Strength</span>
                  <span className={`text-sm font-medium ${strengthUi.text}`}>
                    {strengthUi.label}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full rounded-full transition-all ${strengthUi.bar}`} />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Use at least 8 characters with a mix of uppercase, numbers, and symbols.
                </p>
              </div>
            )}

            {isSetup && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                  placeholder="Confirm master password"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  );
}
