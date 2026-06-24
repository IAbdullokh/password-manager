"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/vault-store";
import { getPasswordReuseCount } from "@/lib/reuse-detection";
import { getPasswordStrength, getPasswordStrengthColor } from "@/lib/password-strength";

export default function NewCredentialPage() {
  const router = useRouter();
  const { addCredential, getAllDecryptedPasswords, isLocked } = useVaultStore();

  const [serviceName, setServiceName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingPasswords, setExistingPasswords] = useState<string[]>([]);

  useEffect(() => {
    if (isLocked) {
      router.push("/");
    }
  }, [isLocked, router]);

  useEffect(() => {
    const loadPasswords = async () => {
      try {
        const passwords = await getAllDecryptedPasswords();
        setExistingPasswords(passwords);
      } catch (error) {
        console.error("Failed to load existing passwords:", error);
        setExistingPasswords([]);
      }
    };

    loadPasswords();
  }, [getAllDecryptedPasswords]);

  const reuseCount = useMemo(() => {
    return getPasswordReuseCount(password, existingPasswords);
  }, [password, existingPasswords]);

  const isReused = reuseCount > 0;

  const strength = useMemo(() => {
    return getPasswordStrength(password);
  }, [password]);

  const strengthColor = getPasswordStrengthColor(strength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!serviceName || !username || !password) {
      setError("Service name, username, and password are required.");
      return;
    }

    try {
      setLoading(true);

      await addCredential({
        id: crypto.randomUUID(),
        serviceName,
        url,
        username,
        password,
        notes,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      router.push("/vault");
    } catch (error) {
      console.error("Failed to save credential:", error);
      setError("Failed to save credential.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-10">
        <h1 className="text-4xl font-bold">Add Credential</h1>
        <p className="mt-3 text-lg text-slate-400">
          Save a new shared company credential.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <input
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="Service name"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-lg outline-none focus:border-cyan-500"
          />

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Service URL"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-lg outline-none focus:border-cyan-500"
          />

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-lg outline-none focus:border-cyan-500"
          />

          <div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-lg outline-none focus:border-cyan-500"
            />

            {password && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-slate-400">Password strength</p>
                <span
                  className="rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `${strengthColor}22`,
                    color: strengthColor,
                    border: `1px solid ${strengthColor}55`,
                  }}
                >
                  {strength}
                </span>
              </div>
            )}

            {isReused && (
              <div className="mt-3 rounded-2xl border border-yellow-700 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                Warning: this password is already used in {reuseCount} other credential
                {reuseCount > 1 ? "s" : ""}.
              </div>
            )}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-lg outline-none focus:border-cyan-500"
          />

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags separated by commas"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-lg outline-none focus:border-cyan-500"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-cyan-500 px-6 py-4 text-lg font-medium text-slate-950 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Credential"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/vault")}
              className="rounded-2xl border border-slate-700 px-6 py-4 text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
