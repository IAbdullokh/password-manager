"use client";

import { useMemo, useState } from "react";
import { useVaultStore } from "@/store/vault-store";

type Props = { mode: "setup" | "unlock" };

function getStrength(p: string) {
  if (!p) return { label: "Empty", width: "0%", color: "rgba(255,255,255,0.08)" };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return { label: "Weak", width: "25%", color: "var(--danger)" };
  if (s === 2) return { label: "Fair", width: "50%", color: "var(--warning)" };
  if (s === 3) return { label: "Good", width: "75%", color: "#1ec487" };
  return { label: "Excellent", width: "100%", color: "var(--accent)" };
}

const FEATURES = [
  { title: "AES-256-GCM", sub: "PBKDF2 - 200k rounds", icon: "lock" },
  { title: "Breach scanner", sub: "Powered by HaveIBeenPwned", icon: "shield" },
  { title: "Strong generator", sub: "Crypto-random, 8-48 chars", icon: "key" },
  { title: "Auto-lock", sub: "Idle timeout, configurable", icon: "clock" },
  { title: "Encrypted backups", sub: "Portable .aegis files", icon: "file" },
  { title: "No server", sub: "100% offline-capable", icon: "server" },
];

function Icon({ type }: { type: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
  };

  switch (type) {
    case "lock":
      return (
        <svg {...props}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4" />
          <circle cx="12" cy="16" r="0.8" fill="currentColor" />
        </svg>
      );
    case "key":
      return (
        <svg {...props}>
          <circle cx="7.5" cy="15.5" r="4.5" />
          <path d="M10.7 12.3L21 2" />
          <path d="M18 5h3v3" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
          <path d="M14 2v5h5" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M8 10h8" />
        </svg>
      );
  }
}

function FAQItem({
  title,
  content,
  open,
  onToggle,
}: {
  title: string;
  content: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderRadius: 24,
        border: "1px solid var(--border-default)",
        background: "rgba(15, 34, 25, 0.72)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          minHeight: 56,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          color: "var(--text-primary)",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, textAlign: "left" }}>
          {title}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
            color: "var(--text-secondary)",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            padding: "0 20px 18px",
            color: "var(--text-secondary)",
            fontSize: 15,
            lineHeight: 1.7,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ paddingTop: 14 }}>{content}</div>
        </div>
      )}
    </div>
  );
}

export default function LockScreen({ mode }: Props) {
  const createMasterPassword = useVaultStore((s) => s.createMasterPassword);
  const unlockVault = useVaultStore((s) => s.unlockVault);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);

  const strength = useMemo(() => getStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setBusy(true);

      if (mode === "setup") {
        if (password.length < 8) {
          setError("Master password must be at least 8 characters.");
          return;
        }

        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }

        await createMasterPassword(password);
        return;
      }

      const ok = await unlockVault(password);

      if (!ok) {
        setError("Incorrect master password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="page-enter"
      style={{
        minHeight: "100vh",
        padding: "40px 0 28px",
      }}
    >
      <div className="app-shell">
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 40,
            alignItems: "start",
          }}
        >
          <div style={{ paddingTop: 8 }}>
            <div
              className="pill"
              style={{
                width: "fit-content",
                marginBottom: 24,
                color: "var(--text-secondary)",
              }}
            >
              <span style={{ color: "var(--accent)" }}>◌</span>
              Zero-knowledge · Open architecture
            </div>

            <div
              style={{
                width: 112,
                height: 136,
                marginBottom: 10,
                opacity: 0.95,
                color: "var(--accent)",
              }}
            >
              <svg
                viewBox="0 0 120 140"
                width="100%"
                height="100%"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M60 8c11 10 27 14 40 15v47c0 31-17 49-40 62C37 119 20 101 20 70V23c13-1 29-5 40-15z"
                  strokeWidth="2"
                  opacity="0.9"
                />
                <path
                  d="M60 20c8 7 19 10 29 11v36c0 24-12 38-29 49-17-11-29-25-29-49V31c10-1 21-4 29-11z"
                  strokeWidth="1.4"
                  opacity="0.55"
                />
                <path d="M38 73c5-5 11-7 17-7 8 0 14 3 20 8" strokeWidth="1.4" opacity="0.45" />
                <path d="M44 88c9-6 22-6 31 0" strokeWidth="1.2" opacity="0.35" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: 74,
                lineHeight: 0.95,
                maxWidth: 620,
                marginBottom: 24,
              }}
            >
              <span style={{ color: "var(--text-primary)" }}>The </span>
              <span style={{ color: "var(--accent)" }}>last password</span>
              <br />
              <span style={{ color: "var(--text-primary)" }}>
                you&apos;ll ever memorize.
              </span>
            </h1>

            <p
              style={{
                maxWidth: 650,
                color: "var(--text-secondary)",
                fontSize: 18,
                lineHeight: 1.65,
                marginBottom: 28,
              }}
            >
              Aegis encrypts every credential in your browser with AES-256-GCM
              before it touches disk. No accounts. No servers. No telemetry.
              Just one master password between your team and chaos.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                maxWidth: 680,
              }}
            >
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="soft-card"
                  style={{
                    minHeight: 84,
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div style={{ color: "var(--text-primary)" }}>
                    <Icon type={feature.icon} />
                  </div>
                  <div>
                    <div
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: 15,
                        marginBottom: 3,
                      }}
                    >
                      {feature.title}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
                      {feature.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: 76 }}>
            <div
              className="section-card"
              style={{
                padding: 32,
              }}
            >
              <div
                style={{
                  color: "var(--accent)",
                  fontSize: 13,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                  fontWeight: 700,
                }}
              >
                {mode === "unlock" ? "Welcome back" : "Create vault"}
              </div>

              <h2
                style={{
                  fontSize: 34,
                  lineHeight: 1.1,
                  marginBottom: 10,
                }}
              >
                {mode === "unlock" ? "Unlock your vault" : "Create your vault"}
              </h2>

              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 18,
                  marginBottom: 26,
                }}
              >
                {mode === "unlock"
                  ? "Enter the master password to decrypt this device's vault."
                  : "Create a master password to encrypt everything stored on this device."}
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 10,
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                    }}
                  >
                    Master password
                  </label>

                  <div style={{ position: "relative" }}>
                    <input
                      type={show ? "text" : "password"}
                      className="field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      style={{ paddingRight: 56 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {mode === "setup" && (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          marginBottom: 8,
                        }}
                      >
                        {Array.from({ length: 4 }).map((_, i) => {
                          const widths = ["25%", "50%", "75%", "100%"];
                          const active =
                            parseInt(strength.width, 10) >= parseInt(widths[i], 10);

                          return (
                            <div
                              key={i}
                              style={{
                                height: 6,
                                flex: 1,
                                borderRadius: 999,
                                background: active
                                  ? strength.color
                                  : "rgba(255,255,255,0.08)",
                              }}
                            />
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        Strength: {strength.label}
                      </div>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: 10,
                          color: "var(--text-secondary)",
                          fontSize: 13,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 700,
                        }}
                      >
                        Confirm password
                      </label>

                      <input
                        type="password"
                        className="field"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div
                    style={{
                      marginBottom: 14,
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

                <button
                  type="submit"
                  className="gold-button"
                  style={{ width: "100%", marginTop: 4 }}
                  disabled={busy}
                >
                  {busy
                    ? mode === "unlock"
                      ? "Unlocking..."
                      : "Creating..."
                    : mode === "unlock"
                    ? "Unlock"
                    : "Create vault"}
                </button>
              </form>
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {[
                {
                  title: "How is my data protected?",
                  content:
                    "All credential passwords are encrypted locally in your browser before they are stored on this device. Your master password is never sent to a server.",
                },
                {
                  title: "Can I recover a forgotten password?",
                  content:
                    "No built-in recovery exists. This is intentional for security. Keep your master password safe and use encrypted backups.",
                },
                {
                  title: "Does this app store data online?",
                  content:
                    "No. Your vault works locally on this device unless you manually export and move a backup yourself.",
                },
              ].map((item, idx) => (
                <FAQItem
                  key={item.title}
                  title={item.title}
                  content={item.content}
                  open={faqOpen === idx}
                  onToggle={() => setFaqOpen((prev) => (prev === idx ? -1 : idx))}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
