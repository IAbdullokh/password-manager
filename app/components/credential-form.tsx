"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Credential, CredentialCategory } from "@/types";
import { CredentialFormInput, useVaultStore } from "@/store/vault-store";

type Props = {
  mode: "create" | "edit";
  credential?: Credential;
  decryptedPassword?: string;
};

const CATEGORIES: CredentialCategory[] = [
  "Internal",
  "Cloud",
  "Social",
  "Finance",
  "Dev",
  "Other",
];

function getPasswordStrength(
  p: string
): "weak" | "fair" | "strong" {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 2) return "weak";
  if (score <= 4) return "fair";
  return "strong";
}

const strengthConfig = {
  weak: { label: "Weak", color: "#ff4757", width: "33%" },
  fair: { label: "Fair", color: "#f5a623", width: "66%" },
  strong: { label: "Strong", color: "#22d3a0", width: "100%" },
};

function generatePassword(opts: {
  length: number;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}) {
  let chars = "abcdefghijklmnopqrstuvwxyz";
  if (opts.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.numbers) chars += "0123456789";
  if (opts.symbols) chars += "!@#$%^&*()_+-={}[]<>?";
  return Array.from(
    { length: opts.length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-secondary)",
        marginBottom: 8,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}

export default function CredentialForm({
  mode,
  credential,
  decryptedPassword = "",
}: Props) {
  const router = useRouter();
  const addCredential = useVaultStore((s) => s.addCredential);
  const updateCredential = useVaultStore((s) => s.updateCredential);
  const credentials = useVaultStore((s) => s.credentials);
  const getDecryptedPassword = useVaultStore((s) => s.getDecryptedPassword);

  const [serviceName, setServiceName] = useState(credential?.serviceName ?? "");
  const [url, setUrl] = useState(credential?.url ?? "");
  const [username, setUsername] = useState(credential?.username ?? "");
  const [password, setPassword] = useState(decryptedPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [notes, setNotes] = useState(credential?.notes ?? "");
  const [tagsInput, setTagsInput] = useState(
    credential?.tags.join(", ") ?? ""
  );
  const [category, setCategory] = useState<CredentialCategory>(
    credential?.category ?? "Internal"
  );
  const [favorite, setFavorite] = useState(credential?.favorite ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reuseCount, setReuseCount] = useState(0);

  const [genLength, setGenLength] = useState(16);
  const [genUppercase, setGenUppercase] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genCopied, setGenCopied] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const sc = strengthConfig[strength];

  const normalizeTags = (input: string) =>
    input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const checkReuseCount = async (plain: string) => {
    if (!plain.trim()) {
      setReuseCount(0);
      return;
    }

    try {
      let count = 0;

      for (const item of credentials) {
        if (mode === "edit" && credential && item.id === credential.id) continue;
        const d = await getDecryptedPassword(item.encryptedPassword);
        if (d === plain) count++;
      }

      setReuseCount(count);
    } catch {
      setReuseCount(0);
    }
  };

  const handlePasswordChange = async (value: string) => {
    setPassword(value);
    await checkReuseCount(value);
  };

  const handleGenerate = async () => {
    const p = generatePassword({
      length: genLength,
      uppercase: genUppercase,
      numbers: genNumbers,
      symbols: genSymbols,
    });
    setPassword(p);
    await checkReuseCount(p);
  };

  const handleCopyGenerated = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setGenCopied(true);
    setTimeout(() => setGenCopied(false), 1500);
  };

  const validate = (): string => {
    if (!serviceName.trim()) return "Service name is required.";
    if (!username.trim()) return "Username is required.";
    if (!password.trim()) return "Password is required.";
    if (url.trim()) {
      try {
        new URL(url);
      } catch {
        return "Please enter a valid URL including https://";
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
      category,
      favorite,
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
    } catch {
      setError("Failed to save credential. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(8,12,20,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/vault"
              style={{
                color: "var(--text-muted)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Vault
            </Link>

            <span style={{ color: "var(--border-strong)" }}>/</span>

            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {mode === "create"
                ? "New credential"
                : `Edit · ${credential?.serviceName}`}
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 20 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <Label>Service name</Label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="AWS, Notion, HubSpot..."
                  className="field"
                  autoFocus
                />
              </div>

              <div>
                <Label>URL</Label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="[example.com](https://example.com/login)"
                  className="field"
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 240px",
                gap: 16,
              }}
            >
              <div>
                <Label>Username / Email</Label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="team@company.com"
                  className="field mono"
                />
              </div>

              <div>
                <Label>Category</Label>
                <select
                  className="field"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as CredentialCategory)
                  }
                >
                  {CATEGORIES.map((item) => (
                    <option
                      key={item}
                      value={item}
                      style={{ background: "#0f2219", color: "#f4efe2" }}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Password</Label>

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter or generate a password"
                  className="field mono"
                  style={{ paddingRight: 44 }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 4,
                  }}
                >
                  {showPassword ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {password && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Strength
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: sc.color,
                      }}
                    >
                      {sc.label}
                    </span>
                  </div>

                  <div
                    style={{
                      height: 4,
                      background: "var(--bg-elevated)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: sc.width,
                        background: sc.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              )}

              {reuseCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginTop: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "rgba(245,166,35,0.08)",
                    border: "1px solid rgba(245,166,35,0.2)",
                    fontSize: 12,
                    color: "#f5a623",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  This password is already used in {reuseCount} other credential
                  {reuseCount > 1 ? "s" : ""}.
                </div>
              )}
            </div>

            <div
              style={{
                background: "rgba(13, 33, 24, 0.75)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 14,
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    Password Generator
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      margin: "3px 0 0",
                    }}
                  >
                    Build a strong random password without leaving the form.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Length
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                      className="mono"
                    >
                      {genLength}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={8}
                    max={32}
                    value={genLength}
                    onChange={(e) => setGenLength(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--accent)" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      label: "Uppercase",
                      value: genUppercase,
                      set: setGenUppercase,
                    },
                    {
                      label: "Numbers",
                      value: genNumbers,
                      set: setGenNumbers,
                    },
                    {
                      label: "Symbols",
                      value: genSymbols,
                      set: setGenSymbols,
                    },
                  ].map(({ label, value, set }) => (
                    <label
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => set(e.target.checked)}
                        style={{
                          accentColor: "var(--accent)",
                          width: 14,
                          height: 14,
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="gold-button"
                  style={{ minHeight: 42, padding: "0 16px" }}
                >
                  Generate
                </button>

                <button
                  type="button"
                  onClick={handleCopyGenerated}
                  className="ghost-button"
                  style={{ minHeight: 42, padding: "0 16px" }}
                >
                  {genCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="textarea"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="work, admin, production"
                className="field"
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--text-secondary)",
                fontSize: 15,
              }}
            >
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
              />
              Mark as favorite
            </label>

            {error && (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(227, 93, 93, 0.24)",
                  background: "rgba(227, 93, 93, 0.10)",
                  color: "#ffb7b7",
                  padding: "12px 14px",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="ghost-button"
                onClick={() => router.push("/vault")}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="gold-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : mode === "create"
                  ? "Save credential"
                  : "Update credential"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
