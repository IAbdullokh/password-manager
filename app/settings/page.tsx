  "use client";

  import Link from "next/link";
  import { useEffect, useMemo, useState } from "react";
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

    const isLocked = useVaultStore((state) => state.isLocked);
    const hasMasterPassword = useVaultStore((state) => state.hasMasterPassword);
    const lockVault = useVaultStore((state) => state.lockVault);
    const credentials = useVaultStore((state) => state.credentials);
    const getDecryptedPassword = useVaultStore((state) => state.getDecryptedPassword);
    const changeMasterPassword = useVaultStore((state) => state.changeMasterPassword);
    const autoLockMinutes = useVaultStore((state) => state.autoLockMinutes);
    const clearClipboardSeconds = useVaultStore(
      (state) => state.clearClipboardSeconds
    );
    const setAutoLockMinutes = useVaultStore((state) => state.setAutoLockMinutes);
    const setClearClipboardSeconds = useVaultStore(
      (state) => state.setClearClipboardSeconds
    );

    const [copied, setCopied] = useState(false);
    const [exportingCsv, setExportingCsv] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [nextPassword, setNextPassword] = useState("");
    const [confirmNextPassword, setConfirmNextPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
      if (isLocked && hasMasterPassword) {
        router.push("/");
      }
    }, [isLocked, hasMasterPassword, router]);

    const securitySummary = useMemo(() => {
      const total = credentials.length;
      const tagged = credentials.filter((item) => item.tags.length > 0).length;
      const withNotes = credentials.filter((item) => item.notes?.trim()).length;

      return { total, tagged, withNotes };
    }, [credentials]);

    const handleExportEncryptedBackup = async () => {
      try {
        const raw = localStorage.getItem("vault_credentials") || "[]";

        const backup = {
          version: 1,
          exportedAt: new Date().toISOString(),
          encrypted: true,
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

    const handleChangeMasterPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError("");
      setPasswordMessage("");

      if (!currentPassword.trim()) {
        setPasswordError("Current master password is required.");
        return;
      }

      if (!nextPassword.trim()) {
        setPasswordError("New master password is required.");
        return;
      }

      if (nextPassword.length < 8) {
        setPasswordError("New master password must be at least 8 characters.");
        return;
      }

      if (nextPassword !== confirmNextPassword) {
        setPasswordError("New passwords do not match.");
        return;
      }

      try {
        setChangingPassword(true);

        const success = await changeMasterPassword(currentPassword, nextPassword);

        if (!success) {
          setPasswordError("Current master password is incorrect.");
          return;
        }

        setPasswordMessage("Master password updated successfully.");
        setCurrentPassword("");
        setNextPassword("");
        setConfirmNextPassword("");
      } catch (error) {
        console.error("Change master password failed:", error);
        setPasswordError("Failed to change master password.");
      } finally {
        setChangingPassword(false);
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
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Settings</h1>
              <p className="mt-2 text-slate-400">
                Manage security, backup, preferences, and vault maintenance.
              </p>
            </div>

            <Link
              href="/vault"
              className="rounded-xl border border-slate-700 px-5 py-3 transition hover:bg-slate-900"
            >
              Back to Vault
            </Link>
          </div>

          <div className="grid gap-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Security Summary</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Saved credentials</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {securitySummary.total}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Tagged entries</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {securitySummary.tagged}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Entries with notes</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {securitySummary.withNotes}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Change Master Password</h2>
              <p className="mt-2 text-sm text-slate-400">
                Re-encrypt all saved passwords under a new master password.
              </p>

              <form onSubmit={handleChangeMasterPassword} className="mt-5 space-y-4">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current master password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                />

                <input
                  type="password"
                  value={nextPassword}
                  onChange={(e) => setNextPassword(e.target.value)}
                  placeholder="New master password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                />

                <input
                  type="password"
                  value={confirmNextPassword}
                  onChange={(e) => setConfirmNextPassword(e.target.value)}
                  placeholder="Confirm new master password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                />

                {passwordError && (
                  <p className="text-sm text-red-400">{passwordError}</p>
                )}

                {passwordMessage && (
                  <p className="text-sm text-emerald-400">{passwordMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 disabled:opacity-60"
                >
                  {changingPassword ? "Updating..." : "Update Master Password"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Preferences</h2>
              <p className="mt-2 text-sm text-slate-400">
                Control vault behavior for safer daily use.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Auto-lock after inactivity
                  </label>
<select
  value={autoLockMinutes}
  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
>
  <option value={1}>1 minute</option>
  <option value={5}>5 minutes</option>
  <option value={10}>10 minutes</option>
  <option value={15}>15 minutes</option>
  <option value={30}>30 minutes</option>
</select>



                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Clear clipboard after copy
                  </label>
                  <select
                    value={clearClipboardSeconds}
                    onChange={(e) =>
                      setClearClipboardSeconds(Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Backup</h2>
              <p className="mt-2 text-sm text-slate-400">
                Download an encrypted backup or export a readable CSV when needed.
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
                trust the device and storage location.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Recovery Note</h2>
              <p className="mt-2 text-sm text-slate-400">
                If the master password is forgotten, encrypted passwords cannot be
                recovered unless you implement a recovery feature later.
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
