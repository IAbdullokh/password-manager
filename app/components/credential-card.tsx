"use client";

import Link from "next/link";
import { useState } from "react";

type CredentialCardProps = {
  id: string;
  serviceName: string;
  url: string;
  username: string;
  tags: string[];
  reused: boolean;
  onCopyUsername: () => void;
  onCopyPassword: () => void;
  onDelete: () => void;
};

function ServiceInitial({ name }: { name: string }) {
  const colors = [
    ["#6c63ff", "#3730a3"],
    ["#22d3a0", "#065f46"],
    ["#f5a623", "#92400e"],
    ["#ff6b9d", "#9d174d"],
    ["#38bdf8", "#075985"],
    ["#a78bfa", "#4c1d95"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [fg, bg] = colors[idx];

  return (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: 11,
      background: `linear-gradient(135deg, ${bg}88, ${bg}44)`,
      border: `1px solid ${fg}44`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      fontWeight: 700,
      color: fg,
      flexShrink: 0,
      fontFamily: "'Inter', sans-serif",
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CopyButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [copied, setCopied] = useState(false);

  const handle = () => {
    onClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handle}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s ease",
        border: "1px solid var(--border-default)",
        background: copied ? "var(--accent-dim)" : "transparent",
        color: copied ? "#a5a0ff" : "var(--text-secondary)",
        borderColor: copied ? "rgba(108,99,255,0.3)" : "var(--border-default)",
      }}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      )}
      {copied ? "Copied!" : label}
    </button>
  );
}

export default function CredentialCard({
  id,
  serviceName,
  url,
  username,
  tags,
  reused,
  onCopyUsername,
  onCopyPassword,
  onDelete,
}: CredentialCardProps) {
  const [hovered, setHovered] = useState(false);

  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-card)",
        border: reused
          ? "1px solid rgba(245,166,35,0.25)"
          : `1px solid ${hovered ? "var(--border-default)" : "var(--border-subtle)"}`,
        borderRadius: 16,
        padding: "18px 20px",
        transition: "all 0.2s ease",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.25)" : "none",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <ServiceInitial name={serviceName} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                {serviceName}
              </h3>
              {reused && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 500,
                  background: "rgba(245,166,35,0.12)",
                  color: "#f5a623",
                  border: "1px solid rgba(245,166,35,0.2)",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Reused
                </span>
              )}
            </div>

            {/* Action buttons — visible on hover */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: hovered ? 1 : 0.4,
              transition: "opacity 0.15s ease",
            }}>
              <Link
                href={`/vault/edit/${id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 10px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                  background: "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </Link>

              <button
                type="button"
                onClick={onDelete}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 8px",
                  borderRadius: 7,
                  fontSize: 12,
                  cursor: "pointer",
                  color: "var(--danger)",
                  border: "1px solid rgba(255,71,87,0.2)",
                  background: "var(--danger-dim)",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>

          {/* Username & URL */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>
              {username}
            </span>
            {url && (
              <>
                <span style={{ color: "var(--border-strong)", fontSize: 12 }}>·</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {displayUrl}
                </a>
              </>
            )}
          </div>

          {/* Password dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</span>
            <span style={{ fontSize: 18, letterSpacing: 2, color: "var(--text-muted)", lineHeight: 1 }}>••••••••••</span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {tags.map((tag) => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
          )}

          {/* Copy actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <CopyButton label="Copy username" onClick={onCopyUsername} />
            <CopyButton label="Copy password" onClick={onCopyPassword} />
          </div>
        </div>
      </div>
    </div>
  );
}
