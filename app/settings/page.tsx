"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/vault-store";

function escapeCsv(value: string) {
  const safe = value ?? "";
  if (
    safe.includes(",") ||
    safe.includes('"') ||
    safe.includes("\n") ||
    safe.includes("\r")
  ) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    isLocked,
    lockVault,
    hasMasterPassword,
    credentials,
    getDecryptedPassword,
  } = useVaultStore();

  const [copied, setCopied] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    if (isLocked && hasMasterPassword) {
      router.push("/");
    }
  }, [isLocked, hasMasterPassword, router]);

  const handleExportEncryptedBackup = async () => {
    try {
      const raw = localStorage.getItem("vault_credentials") || "[]";

      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        credentials: JSON.parse(raw),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "team-vault-backup.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export encrypted backup.");
    }
  };

  const handleExportReadableCsv = async () => {
    const confirmed = window.confirm(
      "This export will contain visible passwords in plain text. Anyone with the file will be able to read them. Continue?"
    );

    if (!confirmed) return;

    try {
      setExportingCsv(true);

      const rows = await Promise.all(
        credentials.map(async (item) => {
          const password = await getDecryptedPassword(item.encryptedPassword);

          return [
            escapeCsv(item.serviceName),
            escapeCsv(item.url),
            escapeCsv(item.username),
            escapeCsv(password),
            escapeCsv(item.notes || ""),
            escapeCsv(item.tags.join(", ")),
            escapeCsv(item.createdAt),
            escapeCsv(item.updatedAt),
          ].join(",");
        })
      );

      const header = [
        "Service Name",
        "URL",
        "Username",
        "Password",
        "Notes",
        "Tags",
        "Created At",
        "Updated At",
      ].join(",");

      const csv = [header, ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "team-vault-readable-export.csv";
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export failed:", error);
      alert("Failed to export readable CSV.");
    } finally {
      setExportingCsv(false);
    }
  };

  const handleResetVault = () => {
    const confirmed = window.confirm(
      "This will permanently delete your vault and master password. This cannot be undone. Continue?"
    );

    if (!confirmed) return;

    localStorage.removeItem("vault_credentials");
    localStorage.removeItem("vault_master_password_hash");

    lockVault();
    router.push("/");
    window.location.reload();
  };

  const handleCopyRecoveryNote = async () => {
    try {
      const text =
        "If you forget the master password, the encrypted vault cannot be recovered. Resetting the vault will erase all saved credentials.";
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      alert("Failed to copy note.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Manage Vault</h1>
            <p className="mt-2 text-slate-400">
              Security settings, backup, and vault maintenance.
            </p>
          </div>

          <Link
            href="/vault"
            className="rounded-xl border border-slate-700 px-5 py-3"
          >
            Back to Vault
          </Link>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Backup</h2>
            <p className="mt-2 text-sm text-slate-400">
              Download a safe encrypted backup or a readable CSV export.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleExportEncryptedBackup}
                className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950"
              >
                Export Encrypted Backup
              </button>

              <button
                onClick={handleExportReadableCsv}
                disabled={exportingCsv}
                className="rounded-xl border border-yellow-700 px-5 py-3 text-yellow-300 disabled:opacity-60"
              >
                {exportingCsv ? "Exporting CSV..." : "Export Readable CSV"}
              </button>
            </div>

            <p className="mt-3 text-xs text-yellow-200/80">
              Readable CSV includes visible passwords. Only export it if you
              trust where the file will be stored.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Recovery Note</h2>
            <p className="mt-2 text-sm text-slate-400">
              If the master password is forgotten, encrypted passwords cannot be
              recovered unless you add a recovery system later.
            </p>

            <div className="mt-4">
              <button
                onClick={handleCopyRecoveryNote}
                className="rounded-xl border border-slate-700 px-5 py-3"
              >
                {copied ? "Copied" : "Copy Recovery Note"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-red-900 bg-red-950/30 p-6">
            <h2 className="text-xl font-semibold text-red-300">Danger Zone</h2>
            <p className="mt-2 text-sm text-red-200/80">
              Resetting the vault deletes all saved credentials and removes the
              master password from this device.
            </p>

            <div className="mt-4">
              <button
                onClick={handleResetVault}
                className="rounded-xl border border-red-700 px-5 py-3 text-red-300"
              >
                Reset Vault
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
