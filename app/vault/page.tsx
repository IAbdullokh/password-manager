"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useVaultStore, CredentialFormInput } from "@/store/vault-store";
import { Credential, CredentialCategory } from "@/types";
import EmptyState from "@/app/components/empty-state";
import PasswordGenerator from "@/app/components/password-generator";

const CATEGORIES: CredentialCategory[] = [
  "Internal",
  "Cloud",
  "Social",
  "Finance",
  "Dev",
  "Other",
];

function generateId() {
  return crypto.randomUUID();
}

function getPasswordStrength(
  p: string
): "empty" | "weak" | "fair" | "good" | "excellent" {
  if (!p) return "empty";
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return "weak";
  if (s === 2) return "fair";
  if (s === 3) return "good";
  return "excellent";
}

function strengthMeta(level: ReturnType<typeof getPasswordStrength>) {
  switch (level) {
    case "weak":
      return { label: "Weak", color: "var(--danger)", bars: 1 };
    case "fair":
      return { label: "Fair", color: "var(--warning)", bars: 2 };
    case "good":
      return { label: "Good", color: "#1dc082", bars: 3 };
    case "excellent":
      return { label: "Excellent", color: "var(--accent)", bars: 5 };
    default:
      return { label: "Empty", color: "rgba(255,255,255,0.08)", bars: 1 };
  }
}

function IconButton({
  children,
  onClick,
  title,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  href?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        title={title}
        className="ghost-button"
        style={{
          width: 46,
          minWidth: 46,
          padding: 0,
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="ghost-button"
      style={{
        width: 46,
        minWidth: 46,
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  accent,
  action,
  icon,
}: {
  label: string;
  value: number;
  accent: string;
  action?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
              color: accent,
            }}
          >
            {value}
          </div>

          {action && (
            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {action}
            </div>
          )}
        </div>

        <div style={{ color: accent }}>{icon}</div>
      </div>
    </div>
  );
}
function CredentialModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CredentialFormInput) => Promise<void>;
}) {
  const [showPw, setShowPw] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  const [form, setForm] = useState<CredentialFormInput>({
    serviceName: "",
    url: "",
    username: "",
    password: "",
    notes: "",
    tags: [],
    category: "Internal",
    favorite: false,
  });

  const resetForm = () => {
    setForm({
      serviceName: "",
      url: "",
      username: "",
      password: "",
      notes: "",
      tags: [],
      category: "Internal",
      favorite: false,
    });
    setTagsInput("");
    setShowPw(false);
    setBusy(false);
  };

  const strength = strengthMeta(getPasswordStrength(form.password));

  if (!open) return null;

  return (
    <>
      <div
        className="modal-overlay"
        onClick={() => {
          resetForm();
          onClose();
        }}
      >
        <div
          className="modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: 680, padding: 24 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <h2 style={{ fontSize: 22, margin: 0 }}>Add login</h2>

            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              style={{ color: "var(--text-secondary)", cursor: "pointer" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                className="field"
                placeholder="e.g. AWS Console"
                value={form.serviceName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, serviceName: e.target.value }))
                }
                style={{
                  borderColor: form.serviceName
                    ? "var(--border-gold)"
                    : "var(--border-default)",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 230px",
                gap: 14,
              }}
            >
              <div>
                <label style={labelStyle}>Username / Email</label>
                <input
                  className="field"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  className="field"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as CredentialCategory,
                    }))
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
              <label style={labelStyle}>Password</label>

              <div style={{ position: "relative" }}>
                <input
                  className="field mono"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  style={{ paddingRight: 88 }}
                />

                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={miniIconStyle}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGenerator(true)}
                    style={{
                      ...miniIconStyle,
                      color: "var(--accent)",
                      borderColor: "var(--border-gold)",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 0 1-15.5 6.4" />
                      <path d="M3 12A9 9 0 0 1 18.5 5.6" />
                      <path d="M7 17H5v-2" />
                      <path d="M17 7h2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 6,
                      flex: 1,
                      borderRadius: 999,
                      background:
                        i < strength.bars
                          ? strength.color
                          : "rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                Strength: {strength.label}
              </div>
            </div>

            <div>
              <label style={labelStyle}>URL (optional)</label>
              <input
                className="field"
                placeholder="https://"
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
              />
            </div>

            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea
                className="textarea"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>

            <div>
              <label style={labelStyle}>Custom tags</label>
              <input
                className="field"
                placeholder="e.g. work, admin, important"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Separate tags with commas.
              </div>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--text-secondary)",
                fontSize: 15,
                marginTop: 4,
              }}
            >
              <input
                type="checkbox"
                checked={form.favorite}
                onChange={(e) =>
                  setForm((f) => ({ ...f, favorite: e.target.checked }))
                }
              />
              Mark as favorite
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 22,
            }}
          >
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="gold-button"
              disabled={busy}
              onClick={async () => {
                if (
                  !form.serviceName.trim() ||
                  !form.username.trim() ||
                  !form.password
                ) {
                  return;
                }

                try {
                  setBusy(true);
                  await onSave({
                    ...form,
                    tags: tagsInput
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  });
                  resetForm();
                  onClose();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <PasswordGenerator
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        onUse={(password) => setForm((f) => ({ ...f, password }))}
      />
    </>
  );
}

function AuditModal({
  open,
  onClose,
  weak,
  reused,
  breached,
}: {
  open: boolean;
  onClose: () => void;
  weak: number;
  reused: number;
  breached: number;
}) {
  if (!open) return null;

  const allClear = weak === 0 && reused === 0 && breached === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680, padding: 24 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 22, margin: 0 }}>Security audit</h2>

          <button
            type="button"
            onClick={onClose}
            style={{ color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 16,
            lineHeight: 1.7,
            marginBottom: 18,
          }}
        >
          Checking against weakness, reuse, age, and the HaveIBeenPwned breach
          database (privacy-preserving k-anonymity).
        </p>

        <div
          style={{
            borderRadius: 24,
            border: "1px solid rgba(34, 211, 138, 0.35)",
            background: "rgba(9, 58, 35, 0.55)",
            padding: 28,
            textAlign: "center",
          }}
        >
          {allClear ? (
            <>
              <div style={{ color: "var(--success)", marginBottom: 12 }}>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>

              <h3 style={{ fontSize: 18, marginBottom: 8 }}>All clear</h3>

              <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
                No weak, reused, old, or breached passwords found.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>
                Attention needed
              </h3>

              <div style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
                Weak: {weak} · Reused: {reused} · Breached: {breached}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteCredentialModal({
  open,
  serviceName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  serviceName: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<boolean>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    setPassword("");
    setBusy(false);
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, padding: 24 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 22, margin: 0 }}>Delete credential</h2>

          <button
            type="button"
            onClick={handleClose}
            style={{ color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: 18,
          }}
        >
          You are about to permanently delete <strong>{serviceName}</strong>.
          Enter your vault password to confirm this action.
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Vault password</label>
          <input
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            type="button"
            className="ghost-button"
            onClick={handleClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="gold-button"
            style={{
              background: "linear-gradient(180deg, #dd6b6b, #c84f4f)",
              color: "#fff7f7",
              boxShadow: "0 10px 30px rgba(200,79,79,0.18)",
            }}
            disabled={busy || !password.trim()}
            onClick={async () => {
              try {
                setBusy(true);
                setError("");

                const ok = await onConfirm(password);

                if (!ok) {
                  setError("Incorrect vault password.");
                  setBusy(false);
                  return;
                }

                handleClose();
              } catch {
                setError("Failed to delete credential.");
                setBusy(false);
              }
            }}
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}


function CredentialRow({
  item,
  reused,
  onCopyUsername,
  onCopyPassword,
  onDelete,
  onToggleFavorite,
}: {
  item: Credential;
  reused: boolean;
  onCopyUsername: () => void;
  onCopyPassword: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}) {
  const displayUrl = item.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div
      style={{
        borderRadius: 22,
        border: reused
          ? "1px solid rgba(215, 157, 66, 0.30)"
          : "1px solid var(--border-default)",
        background:
          "linear-gradient(180deg, rgba(15,34,25,0.92), rgba(11,27,20,0.92))",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            border: "1px solid var(--border-default)",
            background: "rgba(24, 52, 38, 0.9)",
            display: "grid",
            placeItems: "center",
            color: "var(--accent)",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {item.serviceName.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                <h3 style={{ fontSize: 17, margin: 0 }}>{item.serviceName}</h3>

                <span className="tag-pill">{item.category}</span>

                {reused && (
                  <span
                    className="tag-pill"
                    style={{
                      background: "rgba(215, 157, 66, 0.12)",
                      color: "var(--warning)",
                      borderColor: "rgba(215, 157, 66, 0.24)",
                    }}
                  >
                    Reused
                  </span>
                )}

                {item.favorite && <span className="tag-pill">Favorite</span>}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                }}
              >
                <span className="mono">{item.username}</span>

                {item.url && (
                  <>
                    <span style={{ color: "var(--text-dim)" }}>·</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent)" }}
                    >
                      {displayUrl}
                    </a>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="ghost-button"
                onClick={onCopyUsername}
              >
                Copy username
              </button>

              <button
                type="button"
                className="ghost-button"
                onClick={onCopyPassword}
              >
                Copy password
              </button>

              <button
                type="button"
                className="ghost-button"
                onClick={onToggleFavorite}
              >
                {item.favorite ? "Unfavorite" : "Favorite"}
              </button>

              <button
                type="button"
                className="ghost-button"
                onClick={onDelete}
                style={{ color: "#ffb4b4" }}
              >
                Delete
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              color: "var(--text-muted)",
            }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Password
            </span>

            <span className="mono" style={{ letterSpacing: 2 }}>
              ••••••••••••
            </span>
          </div>

          {item.notes && (
            <p
              style={{
                marginTop: 12,
                color: "var(--text-secondary)",
                fontSize: 14,
                lineHeight: 1.65,
              }}
            >
              {item.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 9,
  color: "var(--text-secondary)",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
};

const miniIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid var(--border-default)",
  background: "rgba(19, 42, 31, 0.78)",
  display: "grid",
  placeItems: "center",
  color: "var(--text-secondary)",
  cursor: "pointer",
};

export default function VaultPage() {
  const credentials = useVaultStore((s) => s.credentials);
  const copyUsername = useVaultStore((s) => s.copyUsername);
  const copyPassword = useVaultStore((s) => s.copyPassword);
  const addCredential = useVaultStore((s) => s.addCredential);
  const deleteCredential = useVaultStore((s) => s.deleteCredential);
  const lockVault = useVaultStore((s) => s.lockVault);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const getAllDecryptedPasswords = useVaultStore(
    (s) => s.getAllDecryptedPasswords
  );
  const getReusedCredentialIds = useVaultStore((s) => s.getReusedCredentialIds);
  const autoLockMinutes = useVaultStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useVaultStore((s) => s.setAutoLockMinutes);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CredentialCategory | "All">("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [weakCount, setWeakCount] = useState(0);
  const [reusedIds, setReusedIds] = useState<string[]>([]);
  const [breachedCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const passwords = await getAllDecryptedPasswords();
        const reused = await getReusedCredentialIds();

        if (!active) return;

        setReusedIds(reused);

        const weak = passwords.filter((p) => {
          const score = getPasswordStrength(p);
          return score === "weak" || score === "fair";
        }).length;

        setWeakCount(weak);
      } catch {
        if (!active) return;
        setWeakCount(0);
        setReusedIds([]);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [credentials, getAllDecryptedPasswords, getReusedCredentialIds]);

  const filteredCredentials = useMemo(() => {
    return credentials.filter((item) => {
      const q = query.trim().toLowerCase();

      const matchesQuery =
        !q ||
        item.serviceName.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q);

      const matchesCategory = category === "All" || item.category === category;
      const matchesFavorite = !favoritesOnly || item.favorite;

      return matchesQuery && matchesCategory && matchesFavorite;
    });
  }, [credentials, query, category, favoritesOnly]);

  return (
    <main
      className="page-enter"
      style={{
        minHeight: "100vh",
        padding: "18px 0 26px",
      }}
    >
      <div className="app-shell">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                color: "var(--text-primary)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>

            <div>
              <div
                style={{
                  color: "var(--accent)",
                  fontSize: 13,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Aegis Vault
              </div>

              <h1 style={{ fontSize: 40, margin: 0 }}>Your encrypted vault</h1>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <select
              className="field"
              value={autoLockMinutes}
              onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
              style={{ minWidth: 118, padding: "0 16px", width: "auto" }}
            >
              {[1, 5, 10, 15, 30].map((n) => (
                <option
                  key={n}
                  value={n}
                  style={{ background: "#0f2219", color: "#f4efe2" }}
                >
                  Lock · {n} min
                </option>
              ))}
            </select>
<IconButton title="Settings" href="/settings">

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </IconButton>

            <IconButton title="Run audit" onClick={() => setShowAudit(true)}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
              </svg>
            </IconButton>

            <IconButton
              title="Password generator"
              onClick={() => setShowGenerator(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 0 1-15.5 6.4" />
                <path d="M3 12A9 9 0 0 1 18.5 5.6" />
                <path d="M7 17H5v-2" />
                <path d="M17 7h2v2" />
              </svg>
            </IconButton>

            <IconButton title="Lock vault" onClick={lockVault}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </IconButton>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <StatCard
            label="Saved logins"
            value={credentials.length}
            accent="var(--accent)"
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
          />

          <StatCard
            label="Weak"
            value={weakCount}
            accent="var(--success)"
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v8" />
              </svg>
            }
          />

          <StatCard
            label="Reused"
            value={reusedIds.length}
            accent="var(--success)"
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 2l4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 22l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            }
          />

          <StatCard
            label="Breached"
            value={breachedCount}
            accent="var(--success)"
            action="Run audit"
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h5l2-6 4 12 2-6h5" />
              </svg>
            }
          />
        </div>

        <section className="section-card" style={{ padding: 22 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                minHeight: 56,
                borderRadius: 20,
                border: "1px solid var(--border-default)",
                background: "rgba(19, 42, 31, 0.74)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 16px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: "var(--text-secondary)" }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, username, URL..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: 0,
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: 16,
                }}
              />

              <span
                className="pill"
                style={{
                  minHeight: 28,
                  padding: "0 10px",
                  fontSize: 12,
                }}
              >
                ⌘K
              </span>
            </div>

            <button
              type="button"
              className="gold-button"
              onClick={() => setShowAdd(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add login
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              className="pill"
              onClick={() => {
                setCategory("All");
                setFavoritesOnly(false);
              }}
              style={filterStyle(category === "All" && !favoritesOnly)}
            >
              All
            </button>

            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className="pill"
                onClick={() => {
                  setCategory(item);
                  setFavoritesOnly(false);
                }}
                style={filterStyle(category === item && !favoritesOnly)}
              >
                {item}
              </button>
            ))}

            <div
              style={{
                width: 1,
                height: 22,
                background: "var(--border-subtle)",
                margin: "0 2px",
              }}
            />

            <button
              type="button"
              className="pill"
              onClick={() => {
                setFavoritesOnly(true);
                setCategory("All");
              }}
              style={filterStyle(favoritesOnly)}
            >
              ☆ Favorites
            </button>
          </div>

          {filteredCredentials.length === 0 ? (
            <EmptyState onAdd={() => setShowAdd(true)} />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filteredCredentials.map((item) => (
                <CredentialRow
                  key={item.id}
                  item={item}
                  reused={reusedIds.includes(item.id)}
                  onCopyUsername={() => copyUsername(item.username)}
                  onCopyPassword={() => copyPassword(item.encryptedPassword)}
                  onDelete={() => setDeleteTarget(item)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              ))}
            </div>
          )}
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 18,
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          <div>
            AES-256-GCM · {credentials.length} entries · ⌘K search · ⌘N new ·
            ⌘L lock
          </div>

         <Link
  href="/settings"
  style={{
    color: "var(--text-secondary)",
  }}
>
  Security settings
</Link>

        </div>
      </div>

      <CredentialModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={async (payload) => {
          const now = new Date().toISOString();

          await addCredential({
            id: generateId(),
            createdAt: now,
            updatedAt: now,
            ...payload,
          });
        }}
      />

      <PasswordGenerator
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        onUse={() => {}}
      />

      <AuditModal
        open={showAudit}
        onClose={() => setShowAudit(false)}
        weak={weakCount}
        reused={reusedIds.length}
        breached={breachedCount}
      />

      <DeleteCredentialModal
        open={!!deleteTarget}
        serviceName={deleteTarget?.serviceName || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (password) => {
          if (!deleteTarget) return false;
          const ok = await deleteCredential(deleteTarget.id, password);
          if (ok) {
            setDeleteTarget(null);
          }
          return ok;
        }}
      />
    </main>
  );
}

function filterStyle(active: boolean): CSSProperties {
  return active
    ? {
        color: "var(--accent)",
        borderColor: "var(--border-gold)",
        background: "rgba(230, 191, 91, 0.08)",
      }
    : {};
}
