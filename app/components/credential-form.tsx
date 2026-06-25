"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Credential } from "@/types";
import { CredentialFormInput, useVaultStore } from "@/store/vault-store";

type Props = {
  mode: "create" | "edit";
  credential?: Credential;
  decryptedPassword?: string;
};

function getPasswordStrength(p: string): "weak" | "fair" | "strong" {
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
  weak:   { label: "Weak",   color: "#ff4757", width: "33%" },
  fair:   { label: "Fair",   color: "#f5a623", width: "66%" },
  strong: { label: "Strong", color: "#22d3a0", width: "100%" },
};

function generatePassword(opts: { length: number; uppercase: boolean; numbers: boolean; symbols: boolean }) {
  let chars = "abcdefghijklmnopqrstuvwxyz";
  if (opts.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.numbers) chars += "0123456789";
  if (opts.symbols) chars += "!@#$%^&*()_+-={}[]<>?";
  return Array.from({ length: opts.length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
      {children}
    </label>
  );
}

export default function CredentialForm({ mode, credential, decryptedPassword = "" }: Props) {
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
  const [tagsInput, setTagsInput] = useState(credential?.tags.join(", ") ?? "");
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
    input.split(",").map((t) => t.trim()).filter(Boolean);

  const checkReuseCount = async (plain: string) => {
    if (!plain.trim()) { setReuseCount(0); return; }
    try {
      let count = 0;
      for (const item of credentials) {
        if (mode === "edit" && credential && item.id === credential.id) continue;
        const d = await getDecryptedPassword(item.encryptedPassword);
        if (d === plain) count++;
      }
      setReuseCount(count);
    } catch { setReuseCount(0); }
  };

  const handlePasswordChange = async (value: string) => {
    setPassword(value);
    await checkReuseCount(value);
  };

  const handleGenerate = async () => {
    const p = generatePassword({ length: genLength, uppercase: genUppercase, numbers: genNumbers, symbols: genSymbols });
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
      try { new URL(url); } catch { return "Please enter a valid URL including https://"; }
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
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
        await addCredential({ id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
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
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)" }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,12,20,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/vault" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Vault
            </Link>
            <span style={{ color: "var(--border-strong)" }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {mode === "create" ? "New credential" : `Edit · ${credential?.serviceName}`}
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 20 }}>

            {/* Service + URL */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <Label>Service name</Label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="AWS, Notion, HubSpot…"
                  className="input-base"
                  autoFocus
                />
              </div>
              <div>
                <Label>URL</Label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/login"
                  className="input-base"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <Label>Username / Email</Label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="team@company.com"
                className="input-base"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            {/* Password */}
            <div>
              <Label>Password</Label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter or generate a password"
                  className="input-base"
                  style={{ paddingRight: 44, fontFamily: "'JetBrains Mono', monospace" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                >
                  {showPassword
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              {/* Strength */}
              {password && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Strength</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
                    <div className="strength-bar" style={{ height: "100%", width: sc.width, background: sc.color, borderRadius: 4 }} />
                  </div>
                </div>
              )}

              {reuseCount > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 7, marginTop: 10,
                  padding: "8px 12px", borderRadius: 8,
                  background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)",
                  fontSize: 12, color: "#f5a623",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  This password is already used in {reuseCount} other credential{reuseCount > 1 ? "s" : ""}.
                </div>
              )}
            </div>

            {/* Password Generator */}
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 14,
              padding: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Password Generator</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>Build a strong random password without leaving the form.</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Length</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>{genLength}</span>
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

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Uppercase", value: genUppercase, set: setGenUppercase },
                    { label: "Numbers", value: genNumbers, set: setGenNumbers },
                    { label: "Symbols", value: genSymbols, set: setGenSymbols },
                  ].map(({ label, value, set }) => (
                    <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)" }}>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => set(e.target.checked)}
                        style={{ accentColor: "var(--accent)", width: 14, height: 14 }}
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
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: "var(--accent)", color: "#fff", cursor: "pointer", border: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Generate
                </button>

                <button
                  type="button"
                  onClick={handleCopyGenerated}
                  disabled={!password}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 500,
                    background: genCopied ? "var(--accent-dim)" : "transparent",
                    color: genCopied ? "#a5a0ff" : "var(--text-secondary)",
                    border: `1px solid ${genCopied ? "rgba(108,99,255,0.3)" : "var(--border-default)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    opacity: !password ? 0.4 : 1,
                  }}
                >
                  {genCopied
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                  {genCopied ? "Copied!" : "Copy password"}
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes <span style={{ fontWeight: 400, textTransform: "none", fontSize: 11, color: "var(--text-muted)" }}>(optional)</span></Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Recovery steps, 2FA location, account notes…"
                rows={3}
                className="input-base"
                style={{ resize: "vertical", fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="finance, internal, project-alpha"
                className="input-base"
              />
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Separate tags with commas</p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10,
                background: "var(--danger-dim)", border: "1px solid rgba(255,71,87,0.2)",
                fontSize: 13, color: "#ff8090",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: "var(--accent)", color: "#fff", cursor: "pointer", border: "none",
                  transition: "all 0.15s ease",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                )}
                {saving ? "Saving…" : mode === "create" ? "Save credential" : "Update credential"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/vault")}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                  color: "var(--text-secondary)", border: "1px solid var(--border-default)",
                  background: "transparent", cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
