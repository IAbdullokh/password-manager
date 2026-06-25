"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/vault-store";

function escapeCsv(v: string) {
  const s = v ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "rgba(13, 33, 24, 0.96)",
        border: "1px solid var(--border-default)",
        borderRadius: 24,
        padding: "22px 24px",
      }}
    >
      <p
        style={{
          margin: "0 0 4px",
          fontSize: 20,
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "'Playfair Display', serif",
        }}
      >
        {title}
      </p>

      {subtitle && (
        <p
          style={{
            margin: "0 0 18px",
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          {subtitle}
        </p>
      )}

      {!subtitle && <div style={{ marginBottom: 18 }} />}

      {children}
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const isLocked = useVaultStore((s) => s.isLocked);
  const hasMasterPassword = useVaultStore((s) => s.hasMasterPassword);
  const lockVault = useVaultStore((s) => s.lockVault);
  const credentials = useVaultStore((s) => s.credentials);
  const getDecryptedPassword = useVaultStore((s) => s.getDecryptedPassword);
  const changeMasterPassword = useVaultStore((s) => s.changeMasterPassword);
  const resetVault = useVaultStore((s) => s.resetVault);
  const autoLockMinutes = useVaultStore((s) => s.autoLockMinutes);
  const clearClipboardSeconds = useVaultStore((s) => s.clearClipboardSeconds);
  const setAutoLockMinutes = useVaultStore((s) => s.setAutoLockMinutes);
  const setClearClipboardSeconds = useVaultStore((s) =>
    s.setClearClipboardSeconds
  );

  const [exportingCsv, setExportingCsv] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmNextPassword, setConfirmNextPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [changePwError, setChangePwError] = useState("");
  const [changePwSuccess, setChangePwSuccess] = useState("");

  const [resetPassword, setResetPassword] = useState("");
  const [resetPhrase, setResetPhrase] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (!hasMasterPassword || isLocked) {
      router.push("/");
    }
  }, [hasMasterPassword, isLocked, router]);

  if (!hasMasterPassword || isLocked) {
    return null;
  }

  const exportCsv = async () => {
    try {
      setExportingCsv(true);

      const rows = await Promise.all(
        credentials.map(async (item) => {
          const decryptedPassword = await getDecryptedPassword(
            item.encryptedPassword
          );

          return [
            item.serviceName,
            item.username,
            decryptedPassword,
            item.url,
            item.category,
            item.favorite ? "true" : "false",
            item.notes || "",
            item.tags.join("|"),
            item.createdAt,
            item.updatedAt,
          ];
        })
      );

      const header = [
        "serviceName",
        "username",
        "password",
        "url",
        "category",
        "favorite",
        "notes",
        "tags",
        "createdAt",
        "updatedAt",
      ];

      const csv = [
        header.join(","),
        ...rows.map((row) => row.map((cell) => escapeCsv(cell)).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "aegis-vault-export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } finally {
      setExportingCsv(false);
    }
  };

  const submitPasswordChange = async () => {
    setChangePwError("");
    setChangePwSuccess("");

    if (!currentPassword || !nextPassword || !confirmNextPassword) {
      setChangePwError("Fill in all password fields.");
      return;
    }

    if (nextPassword.length < 8) {
      setChangePwError("New master password must be at least 8 characters.");
      return;
    }

    if (nextPassword !== confirmNextPassword) {
      setChangePwError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === nextPassword) {
      setChangePwError(
        "New master password must be different from the current one."
      );
      return;
    }

    try {
      setChangingPw(true);
      const ok = await changeMasterPassword(currentPassword, nextPassword);

      if (!ok) {
        setChangePwError("Current vault password is incorrect.");
        return;
      }

      setCurrentPassword("");
      setNextPassword("");
      setConfirmNextPassword("");
      setChangePwSuccess("Vault password updated successfully.");
    } catch {
      setChangePwError("Failed to change master password.");
    } finally {
      setChangingPw(false);
    }
  };

  const submitReset = async () => {
    setResetError("");

    if (!resetPassword) {
      setResetError("Enter your vault password.");
      return;
    }

    if (resetPhrase !== "RESET") {
      setResetError('Type RESET exactly to confirm vault deletion.');
      return;
    }

    try {
      setResetBusy(true);
      const ok = await resetVault(resetPassword);

      if (!ok) {
        setResetError("Incorrect vault password.");
        return;
      }

      router.push("/");
    } catch {
      setResetError("Failed to reset vault.");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <main
      className="page-enter"
      style={{
        minHeight: "100vh",
        padding: "24px 0 40px",
      }}
    >
      <div className="app-shell" style={{ maxWidth: 980 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                color: "var(--accent)",
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Security settings
            </div>

            <h1 style={{ fontSize: 40, margin: 0 }}>Vault settings</h1>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/vault" className="ghost-button">
              Back to vault
            </Link>

            <button type="button" className="ghost-button" onClick={lockVault}>
              Lock vault
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <Card
            title="Vault password"
            subtitle="Change the master password used to decrypt and re-encrypt your stored credentials."
          >
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={labelStyle}>Current password</label>
                <input
                  type="password"
                  className="field"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>New password</label>
                <input
                  type="password"
                  className="field"
                  value={nextPassword}
                  onChange={(e) => setNextPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirm new password</label>
                <input
                  type="password"
                  className="field"
                  value={confirmNextPassword}
                  onChange={(e) => setConfirmNextPassword(e.target.value)}
                />
              </div>

              {changePwError && (
                <div style={errorBoxStyle}>{changePwError}</div>
              )}

              {changePwSuccess && (
                <div style={successBoxStyle}>{changePwSuccess}</div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="gold-button"
                  disabled={changingPw}
                  onClick={submitPasswordChange}
                >
                  {changingPw ? "Updating..." : "Change vault password"}
                </button>
              </div>
            </div>
          </Card>

          <Card
            title="Backup options"
            subtitle="Export your vault as a CSV backup. Store exported files securely because they contain decrypted credential data."
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Export includes service name, username, password, URL, category,
                notes, tags, and timestamps.
              </div>

              <button
                type="button"
                className="gold-button"
                disabled={exportingCsv}
                onClick={exportCsv}
              >
                {exportingCsv ? "Exporting..." : "Export CSV backup"}
              </button>
            </div>
          </Card>

          <Card
            title="Automatic security"
            subtitle="Control idle auto-lock timing and clipboard clearing behavior."
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Auto-lock after</label>
                <select
                  className="field"
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                >
                  {[1, 5, 10, 15, 30, 60].map((value) => (
                    <option
                      key={value}
                      value={value}
                      style={{ background: "#0f2219", color: "#f4efe2" }}
                    >
                      {value} minute{value > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Clear clipboard after</label>
                <select
                  className="field"
                  value={clearClipboardSeconds}
                  onChange={(e) =>
                    setClearClipboardSeconds(Number(e.target.value))
                  }
                >
                  {[10, 15, 30, 45, 60, 120].map((value) => (
                    <option
                      key={value}
                      value={value}
                      style={{ background: "#0f2219", color: "#f4efe2" }}
                    >
                      {value} second{value > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card
            title="Danger zone"
            subtitle="Resetting the vault permanently removes all stored credentials and the master password from this device."
          >
            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(227, 93, 93, 0.24)",
                  background: "rgba(227, 93, 93, 0.08)",
                  padding: "16px 18px",
                  color: "#ffc1c1",
                  lineHeight: 1.7,
                }}
              >
                This action is irreversible. To continue, enter your vault
                password and type <strong>RESET</strong>.
              </div>

              <div>
                <label style={labelStyle}>Vault password</label>
                <input
                  type="password"
                  className="field"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Type RESET to confirm</label>
                <input
                  type="text"
                  className="field"
                  value={resetPhrase}
                  onChange={(e) => setResetPhrase(e.target.value)}
                />
              </div>

              {resetError && <div style={errorBoxStyle}>{resetError}</div>}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={resetBusy}
                  onClick={submitReset}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    minHeight: 48,
                    padding: "0 22px",
                    borderRadius: 999,
                    background: "linear-gradient(180deg, #d76b6b, #bf4f4f)",
                    color: "#fff7f7",
                    fontWeight: 700,
                    boxShadow: "0 10px 30px rgba(227, 93, 93, 0.18)",
                    transition:
                      "transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease",
                    cursor: "pointer",
                  }}
                >
                  {resetBusy ? "Resetting..." : "Reset vault permanently"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 10,
  color: "var(--text-secondary)",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
};

const errorBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(227, 93, 93, 0.24)",
  background: "rgba(227, 93, 93, 0.10)",
  color: "#ffb7b7",
  padding: "12px 14px",
  fontSize: 14,
};

const successBoxStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(34, 211, 138, 0.24)",
  background: "rgba(34, 211, 138, 0.10)",
  color: "#baf5d5",
  padding: "12px 14px",
  fontSize: 14,
};
