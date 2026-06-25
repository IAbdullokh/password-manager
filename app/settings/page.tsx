"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/vault-store";

function escapeCsv(v: string) {
  const s = v ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--green-900)", border: "1px solid var(--border-default)", borderRadius: 16, padding: "22px 24px" }}>
      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>{title}</p>
      {subtitle && <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-muted)" }}>{subtitle}</p>}
      {!subtitle && <div style={{ marginBottom: 18 }} />}
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const isLocked = useVaultStore(s => s.isLocked);
  const hasMasterPassword = useVaultStore(s => s.hasMasterPassword);
  const lockVault = useVaultStore(s => s.lockVault);
  const credentials = useVaultStore(s => s.credentials);
  const getDecryptedPassword = useVaultStore(s => s.getDecryptedPassword);
  const changeMasterPassword = useVaultStore(s => s.changeMasterPassword);
  const autoLockMinutes = useVaultStore(s => s.autoLockMinutes);
  const clearClipboardSeconds = useVaultStore(s => s.clearClipboardSeconds);
  const setAutoLockMinutes = useVaultStore(s => s.setAutoLockMinutes);
  const setClearClipboardSeconds = useVaultStore(s => s.setClearClipboardSeconds);

  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { if (isLocked && hasMasterPassword) router.push("/"); }, [isLocked, hasMasterPassword, router]);

  const summary = useMemo(() => ({
    total: credentials.length,
    tagged: credentials.filter(c => c.tags.length > 0).length,
    withNotes: credentials.filter(c => c.notes?.trim()).length,
  }), [credentials]);

  const handleExportEncrypted = async () => {
    const raw = localStorage.getItem("vault_credentials") || "[]";
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), encrypted: true, credentials: JSON.parse(raw) }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "team-vault-backup.json"; a.click(); URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    if (!window.confirm("This export includes visible passwords. Continue?")) return;
    setExportingCsv(true);
    try {
      const rows = await Promise.all(credentials.map(async item => {
        const pw = await getDecryptedPassword(item.encryptedPassword);
        return [item.serviceName, item.url, item.username, pw, item.notes||"", item.tags.join(", "), item.createdAt, item.updatedAt].map(escapeCsv).join(",");
      }));
      const csv = ["Service,URL,Username,Password,Notes,Tags,Created,Updated", ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "vault-export.csv"; a.click(); URL.revokeObjectURL(url);
    } finally { setExportingCsv(false); }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwErr(""); setPwMsg("");
    if (!curPw.trim()) { setPwErr("Current password required."); return; }
    if (newPw.length < 8) { setPwErr("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwErr("Passwords do not match."); return; }
    setChangingPw(true);
    try {
      const ok = await changeMasterPassword(curPw, newPw);
      if (!ok) { setPwErr("Current password is incorrect."); return; }
      setPwMsg("Password updated successfully."); setCurPw(""); setNewPw(""); setConfirmPw("");
    } catch { setPwErr("Failed to change password."); } finally { setChangingPw(false); }
  };

  const handleReset = () => {
    if (!window.confirm("Delete all vault data permanently? This cannot be undone.")) return;
    localStorage.removeItem("vault_credentials"); localStorage.removeItem("vault_master_password_hash");
    lockVault(); router.push("/"); window.location.reload();
  };

  const inputStyle = { width: "100%", background: "var(--green-800)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { display: "block" as const, fontSize: 11, fontWeight: 600 as const, color: "var(--text-muted)" as const, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--green-950)", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border-subtle)", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,26,13,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-400)" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Settings</p>
        </div>
        <Link href="/vault" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-default)" }}>
          ← Back to vault
        </Link>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Security summary */}
        <Card title="Security summary">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { label: "Saved credentials", value: summary.total, color: "var(--gold-400)" },
              { label: "Tagged entries", value: summary.tagged, color: "var(--success)" },
              { label: "With notes", value: summary.withNotes, color: "var(--text-secondary)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--green-800)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color, fontFamily: "'Playfair Display', serif" }}>{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Change master password */}
        <Card title="Change master password" subtitle="All saved passwords will be re-encrypted under the new key.">
          <form onSubmit={handleChangePw} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                {showPw ? "Hide" : "Show"} passwords
              </button>
            </div>
            {[
              { ph: "Current master password", val: curPw, set: setCurPw },
              { ph: "New master password", val: newPw, set: setNewPw },
              { ph: "Confirm new password", val: confirmPw, set: setConfirmPw },
            ].map(({ ph, val, set }) => (
              <input key={ph} type={showPw ? "text" : "password"} value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inputStyle} />
            ))}
            {pwErr && <p style={{ margin: 0, fontSize: 13, color: "var(--danger)", padding: "8px 12px", background: "var(--danger-dim)", borderRadius: 8 }}>{pwErr}</p>}
            {pwMsg && <p style={{ margin: 0, fontSize: 13, color: "var(--success)", padding: "8px 12px", background: "rgba(76,175,130,0.08)", borderRadius: 8 }}>{pwMsg}</p>}
            <div>
              <button type="submit" disabled={changingPw} style={{ padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "var(--gold-400)", color: "#0a1a0a", border: "none", cursor: "pointer", opacity: changingPw ? 0.7 : 1 }}>
                {changingPw ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </Card>

        {/* Preferences */}
        <Card title="Preferences" subtitle="Control vault behavior for safer daily use.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Auto-lock after inactivity", val: autoLockMinutes, set: setAutoLockMinutes, options: [1,5,10,15,30].map(m => ({ value: m, label: `${m} ${m===1?"minute":"minutes"}` })) },
              { label: "Clear clipboard after copy", val: clearClipboardSeconds, set: setClearClipboardSeconds, options: [10,15,30,60].map(s => ({ value: s, label: `${s} seconds` })) },
            ].map(({ label, val, set, options }) => (
              <div key={label}>
                <label style={labelStyle}>{label}</label>
                <select value={val} onChange={e => set(Number(e.target.value))} style={{ ...inputStyle, cursor: "pointer" }}>
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Card>

        {/* Backup */}
        <Card title="Backup & export" subtitle="Download a backup or export data for external use.">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleExportEncrypted} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "var(--gold-400)", color: "#0a1a0a", border: "none", cursor: "pointer" }}>
              ⬇ Export encrypted backup
            </button>
            <button onClick={handleExportCsv} disabled={exportingCsv} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "rgba(212,146,74,0.10)", color: "var(--warning)", border: "1px solid rgba(212,146,74,0.25)", cursor: "pointer", opacity: exportingCsv ? 0.7 : 1 }}>
              {exportingCsv ? "Exporting…" : "⚠ Export readable CSV"}
            </button>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Readable CSV includes visible passwords — only export to trusted devices.</p>
        </Card>

        {/* Recovery note */}
        <Card title="Recovery note" subtitle="If the master password is forgotten, the vault cannot be decrypted.">
          <button onClick={async () => { await navigator.clipboard.writeText("If you forget the master password, the encrypted vault cannot be recovered."); setRecoveryCopied(true); setTimeout(() => setRecoveryCopied(false), 1500); }}
            style={{ padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 500, background: recoveryCopied ? "rgba(201,168,76,0.12)" : "transparent", color: recoveryCopied ? "var(--gold-300)" : "var(--text-secondary)", border: "1px solid var(--border-default)", cursor: "pointer", transition: "all 0.15s" }}>
            {recoveryCopied ? "✓ Copied!" : "Copy recovery note"}
          </button>
        </Card>

        {/* Danger zone */}
        <section style={{ background: "rgba(224,82,82,0.04)", border: "1px solid rgba(224,82,82,0.2)", borderRadius: 16, padding: "22px 24px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "var(--danger)", fontFamily: "'Playfair Display', serif" }}>Danger zone</p>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(224,82,82,0.6)" }}>Resetting permanently deletes all credentials and removes the master password from this device.</p>
          <button onClick={handleReset} style={{ padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, background: "var(--danger-dim)", color: "var(--danger)", border: "1px solid rgba(224,82,82,0.3)", cursor: "pointer" }}>
            Reset vault
          </button>
        </section>

      </main>
    </div>
  );
}
