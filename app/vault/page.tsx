"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/vault-store";

export default function VaultPage() {
  const router = useRouter();
  const {
    credentials,
    isLocked,
    lockVault,
    deleteCredential,
    copyPassword,
    getDecryptedPassword,
  } = useVaultStore();

  const [search, setSearch] = useState("");
  const [decryptedPasswords, setDecryptedPasswords] = useState<string[]>([]);

  useEffect(() => {
    if (isLocked) {
      router.push("/");
    }
  }, [isLocked, router]);

  useEffect(() => {
    const loadPasswords = async () => {
      if (isLocked || credentials.length === 0) {
        setDecryptedPasswords([]);
        return;
      }

      try {
        const passwords = await Promise.all(
          credentials.map((item) => getDecryptedPassword(item.encryptedPassword))
        );

        setDecryptedPasswords(passwords);
      } catch (error) {
        console.error("Failed to load decrypted passwords:", error);
        setDecryptedPasswords([]);
      }
    };

    loadPasswords();
  }, [credentials, getDecryptedPassword, isLocked]);

  const reusedIds = useMemo(() => {
    if (decryptedPasswords.length === 0) return [];

    const counts = new Map<string, number>();

    decryptedPasswords.forEach((password) => {
      counts.set(password, (counts.get(password) || 0) + 1);
    });

    return credentials
      .filter((item, index) => {
        const password = decryptedPasswords[index];
        return password && (counts.get(password) || 0) > 1;
      })
      .map((item) => item.id);
  }, [credentials, decryptedPasswords]);

  const filteredCredentials = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return credentials;

    return credentials.filter((item) => {
      return (
        item.serviceName.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [credentials, search]);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      alert("Copied");
    } catch {
      alert("Copy failed");
    }
  };

  const handleCopyPassword = async (encryptedPassword: string) => {
    try {
      await copyPassword(encryptedPassword);
      alert("Password copied");
    } catch (err) {
      console.error("Copy password error:", err);
      alert("Failed to copy password");
    }
  };

  const handleDelete = (id: string, serviceName: string) => {
    const confirmed = window.confirm(
      `Delete "${serviceName}"? This action cannot be undone.`
    );

    if (confirmed) {
      deleteCredential(id);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Vault</h1>
            <p className="mt-2 text-slate-400">
              Manage your saved credentials securely.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/vault/new"
              className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950"
            >
              Add Credential
            </Link>

            <Link
              href="/settings"
              className="rounded-xl border border-slate-700 px-5 py-3"
            >
              Manage Vault
            </Link>

            <button
              onClick={lockVault}
              className="rounded-xl border border-slate-700 px-5 py-3"
            >
              Lock
            </button>
          </div>
        </div>

        {reusedIds.length > 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-700 bg-yellow-500/10 p-4 text-yellow-200">
            <p className="font-semibold">Password reuse warning</p>
            <p className="mt-1 text-sm text-yellow-100/80">
              Some passwords are used in multiple credentials. Reused passwords
              make the vault less secure.
            </p>
          </div>
        )}

        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service, username, URL, or tag"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
          />
        </div>

        {filteredCredentials.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            No credentials found.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCredentials.map((item) => {
              const isReused = reusedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">
                          {item.serviceName}
                        </h2>

                        {isReused && (
                          <span className="rounded-full border border-yellow-700 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                            Reused password
                          </span>
                        )}
                      </div>

                      {item.url && (
                        <p className="mt-1 text-sm text-slate-400">{item.url}</p>
                      )}

                      <p className="mt-3 text-sm text-slate-300">
                        Username: {item.username}
                      </p>

                      {item.notes && (
                        <p className="mt-3 text-sm text-slate-400">{item.notes}</p>
                      )}

                      {item.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => copyText(item.username)}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
                      >
                        Copy Username
                      </button>

                      <button
                        onClick={() => handleCopyPassword(item.encryptedPassword)}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm"
                      >
                        Copy Password
                      </button>

                      <Link
                        href={`/vault/edit/${item.id}`}
                        className="rounded-lg border border-cyan-700 px-4 py-2 text-center text-sm text-cyan-300"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(item.id, item.serviceName)}
                        className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
