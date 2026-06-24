"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useVaultStore } from "@/store/vault-store";
import { getPasswordReuseCount } from "@/lib/reuse-detection";
import {
  getPasswordStrength,
  getPasswordStrengthColor,
} from "@/lib/password-strength";

export default function EditCredentialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const {
    credentials,
    updateCredential,
    getDecryptedPassword,
    getAllDecryptedPasswords,
    isLocked,
  } = useVaultStore();

  const credential = credentials.find((item) => item.id === id);

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
    const loadCredential = async () => {
      if (!credential) return;

      setServiceName(credential.serviceName);
      setUrl(credential.url);
      setUsername(credential.username);
      setNotes(credential.notes || "");
      setTags(credential.tags.join(", "));

      try {
        const decryptedPassword = await getDecryptedPassword(
          credential.encryptedPassword
        );
        setPassword(decryptedPassword);
      } catch (error) {
        console.error(error);
        setError("Failed to decrypt password.");
      }
    };

    loadCredential();
  }, [credential, getDecryptedPassword]);

  useEffect(() => {
    const loadOtherPasswords = async () => {
      if (!credential) return;

      try {
        const allPasswords = await getAllDecryptedPasswords();

        const currentIndex = credentials.findIndex((item) => item.id === id);

        const otherPasswords = allPasswords.filter(
          (_, index) => index !== currentIndex
        );

        setExistingPasswords(otherPasswords);
      } catch (error) {
        console.error("Failed to load existing passwords:", error);
        setExistingPasswords([]);
      }
    };

    loadOtherPasswords();
  }, [credential, credentials, getAllDecryptedPasswords, id]);

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

      await updateCredential(id, {
        serviceName,
        url,
        username,
        password,
        notes,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      router.push("/vault");
    } catch (error) {
      console.error(error);
      setError("Failed to update credential.");
    } finally {
      setLoading(false);
    }
  };

  if (!credential) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-10">
          <h1 className="text-3xl font-bold">Credential not found</h1>
          <p className="mt-3 text-slate-400">
            The credential you want to edit does not exist.
          </p>

          <button
            onClick={() => router.push("/vault")}
            className="mt-6 rounded-2xl border border-slate-700 px-6 py-3"
          >
            Back to Vault
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-10">
        <h1 className="text-4xl font-bold">Edit Credential</h1>
        <p className="mt-3 text-lg text-slate-400">
          Update an existing shared company credential.
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
                Warning: this password is already used in {reuseCount} other
                credential{reuseCount > 1 ? "s" : ""}.
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
              {loading ? "Saving..." : "Save Changes"}
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
