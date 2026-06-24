"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Credential } from "@/types";
import { CredentialFormInput, useVaultStore } from "@/store/vault-store";

type CredentialFormProps = {
  mode: "create" | "edit";
  credential?: Credential;
  decryptedPassword?: string;
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

function getStrengthClasses(strength: "weak" | "fair" | "strong") {
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

function generatePassword(options?: {
  length?: number;
  uppercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}) {
  const length = options?.length ?? 16;
  const uppercase = options?.uppercase ?? true;
  const numbers = options?.numbers ?? true;
  const symbols = options?.symbols ?? true;

  let chars = "abcdefghijklmnopqrstuvwxyz";

  if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (numbers) chars += "0123456789";
  if (symbols) chars += "!@#$%^&*()_+-={}[]<>?";

  let result = "";

  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * chars.length);
    result += chars[index];
  }

  return result;
}

export default function CredentialForm({
  mode,
  credential,
  decryptedPassword = "",
}: CredentialFormProps) {
  const router = useRouter();
  const addCredential = useVaultStore((state) => state.addCredential);
  const updateCredential = useVaultStore((state) => state.updateCredential);
  const credentials = useVaultStore((state) => state.credentials);
  const getDecryptedPassword = useVaultStore((state) => state.getDecryptedPassword);

  const [serviceName, setServiceName] = useState(credential?.serviceName ?? "");
  const [url, setUrl] = useState(credential?.url ?? "");
  const [username, setUsername] = useState(credential?.username ?? "");
  const [password, setPassword] = useState(decryptedPassword);
  const [notes, setNotes] = useState(credential?.notes ?? "");
  const [tagsInput, setTagsInput] = useState(credential?.tags.join(", ") ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatorLength, setGeneratorLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthUi = getStrengthClasses(passwordStrength);

  const [reuseCount, setReuseCount] = useState(0);

  const normalizeTags = (input: string) =>
    input
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  const checkReuseCount = async (plainPassword: string) => {
    if (!plainPassword.trim()) {
      setReuseCount(0);
      return;
    }

    try {
      let count = 0;

      for (const item of credentials) {
        if (mode === "edit" && credential && item.id === credential.id) {
          continue;
        }

        const decrypted = await getDecryptedPassword(item.encryptedPassword);

        if (decrypted === plainPassword) {
          count += 1;
        }
      }

      setReuseCount(count);
    } catch (err) {
      console.error("Failed to check reuse count:", err);
      setReuseCount(0);
    }
  };

  const handlePasswordChange = async (value: string) => {
    setPassword(value);
    await checkReuseCount(value);
  };

  const handleGeneratePassword = async () => {
    const generated = generatePassword({
      length: generatorLength,
      uppercase: includeUppercase,
      numbers: includeNumbers,
      symbols: includeSymbols,
    });

    setPassword(generated);
    await checkReuseCount(generated);
  };

  const handleCopyGeneratedPassword = async () => {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
    } catch (err) {
      console.error("Failed to copy generated password:", err);
    }
  };

  const validate = (): string => {
    if (!serviceName.trim()) return "Service name is required.";
    if (!username.trim()) return "Username is required.";
    if (!password.trim()) return "Password is required.";

    if (url.trim()) {
      try {
        new URL(url);
      } catch {
        return "Please enter a valid URL, including https://";
      }
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSaving(true);

    const payload: CredentialFormInput = {
      serviceName: serviceName.trim(),
      url: url.trim(),
      username: username.trim(),
      password,
      notes: notes.trim(),
      tags: normalizeTags(tagsInput),
    };

    try {
      if (mode === "create") {
        await addCredential({
          id: crypto.randomUUID(),
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (credential) {
        await updateCredential(credential.id, payload);
      }

      router.push("/vault");
    } catch (err) {
      console.error("Failed to save credential:", err);
      setError("Failed to save credential. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          {mode === "create" ? "Add Credential" : "Edit Credential"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Store company credentials securely with encrypted password storage.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-200">
            Service name
          </label>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="AWS, Notion, HubSpot..."
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-200">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="[example.com](https://example.com/login)"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-200">
            Username / Email
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="team@company.com"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-200">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Enter or generate a secure password"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
          />

          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Strength</span>
              <span className={`text-sm font-medium ${strengthUi.text}`}>
                {strengthUi.label}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className={`h-full rounded-full transition-all ${strengthUi.bar}`} />
            </div>
          </div>

          {reuseCount > 0 && (
            <p className="mt-3 text-sm font-medium text-amber-400">
              Warning: this password is already used in {reuseCount} other
              credential{reuseCount > 1 ? "s" : ""}.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">
              Password Generator
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Generate a stronger password without leaving the form.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Length</label>
              <input
                type="range"
                min={8}
                max={32}
                value={generatorLength}
                onChange={(e) => setGeneratorLength(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-2 text-sm text-zinc-400">{generatorLength} characters</p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                />
                Include uppercase
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                />
                Include numbers
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                />
                Include symbols
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
            >
              Generate password
            </button>

            <button
              type="button"
              onClick={handleCopyGeneratedPassword}
              className="rounded-xl border border-white/10 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Copy generated password
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-200">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes, recovery steps, 2FA reminder..."
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-200">
            Tags
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="finance, internal, project-alpha"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-sky-500"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Separate tags with commas.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : mode === "create"
              ? "Save Credential"
              : "Update Credential"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/vault")}
            className="rounded-xl border border-white/10 bg-zinc-900 px-5 py-3 font-medium text-white transition hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
