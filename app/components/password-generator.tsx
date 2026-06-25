"use client";

import { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUse: (password: string) => void;
};

function generatePassword(opts: {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
}) {
  let chars = "";
  if (opts.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (opts.digits) chars += "0123456789";
  if (opts.symbols) chars += "!@#$%^&*()_+-={}[]<>?";

  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

  return Array.from({ length: opts.length }, () => {
    const index = Math.floor(Math.random() * chars.length);
    return chars[index];
  }).join("");
}

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "var(--danger)", bars: 1 };
  if (score === 2) return { label: "Fair", color: "var(--warning)", bars: 2 };
  if (score === 3) return { label: "Good", color: "#18b97a", bars: 3 };
  if (score === 4) return { label: "Strong", color: "var(--accent)", bars: 4 };
  return { label: "Excellent", color: "var(--accent)", bars: 5 };
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        minHeight: 44,
        borderRadius: 16,
        border: "1px solid var(--border-default)",
        background: "rgba(18, 39, 29, 0.76)",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0 14px",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `1px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
          background: checked ? "var(--accent)" : "transparent",
          display: "grid",
          placeItems: "center",
          color: "#1f1808",
        }}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M5 12l5 5L19 7" />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function PasswordGenerator({
  open,
  onClose,
  onUse,
}: Props) {
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [nonce, setNonce] = useState(0);

  const password = useMemo(() => {
    if (!open) return "";
    return generatePassword({
      length,
      upper,
      lower,
      digits,
      symbols,
    });
  }, [open, length, upper, lower, digits, symbols, nonce]);

  const strength = useMemo(() => getStrength(password), [password]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, padding: 24 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 22, margin: 0 }}>Password generator</h2>
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

        <div
          style={{
            borderRadius: 22,
            border: "1px solid var(--border-default)",
            background: "rgba(17, 40, 29, 0.86)",
            padding: 16,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 16,
              color: "var(--accent)",
              wordBreak: "break-all",
              marginBottom: 12,
            }}
          >
            {password}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 6,
                  flex: 1,
                  borderRadius: 999,
                  background:
                    i < strength.bars ? strength.color : "rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>

          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Strength: {strength.label}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              color: "var(--text-secondary)",
            }}
          >
            <span>Length</span>
            <span>{length}</span>
          </div>

          <input
            type="range"
            min={8}
            max={48}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 18,
          }}
        >
          <Toggle checked={upper} onChange={setUpper} label="Upper" />
          <Toggle checked={lower} onChange={setLower} label="Lower" />
          <Toggle checked={digits} onChange={setDigits} label="Digits" />
          <Toggle checked={symbols} onChange={setSymbols} label="Symbols" />
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 22,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="ghost-button"
            onClick={() => setNonce((n) => n + 1)}
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
            Regenerate
          </button>

          <button
            type="button"
            className="gold-button"
            style={{ flex: 1 }}
            onClick={async () => {
              await navigator.clipboard.writeText(password);
              onUse(password);
              onClose();
            }}
          >
            Copy & use
          </button>
        </div>
      </div>
    </div>
  );
}
