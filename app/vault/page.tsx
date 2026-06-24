"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CredentialCard from "@/app/components/credential-card";
import { useVaultStore } from "@/store/vault-store";

export default function VaultPage() {
  const router = useRouter();

  const credentials = useVaultStore((state) => state.credentials);
  const isLocked = useVaultStore((state) => state.isLocked);
  const lockVault = useVaultStore((state) => state.lockVault);
  const deleteCredential = useVaultStore((state) => state.deleteCredential);
  const copyUsername = useVaultStore((state) => state.copyUsername);
  const copyPassword = useVaultStore((state) => state.copyPassword);
  const getReusedCredentialIds = useVaultStore(
    (state) => state.getReusedCredentialIds
  );

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [reusedIds, setReusedIds] = useState<string[]>([]);
  const [copiedMessage, setCopiedMessage] = useState("");

  useEffect(() => {
    if (isLocked) {
      router.push("/");
    }
  }, [isLocked, router]);

  useEffect(() => {
    const loadReusedIds = async () => {
      if (isLocked || credentials.length === 0) {
        setReusedIds([]);
        return;
      }

      try {
        const ids = await getReusedCredentialIds();
        setReusedIds(ids);
      } catch (error) {
        console.error("Failed to load reused credential ids:", error);
        setReusedIds([]);
      }
    };

    loadReusedIds();
  }, [credentials, getReusedCredentialIds, isLocked]);

  useEffect(() => {
    if (!copiedMessage) return;

    const timeout = window.setTimeout(() => {
      setCopiedMessage("");
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [copiedMessage]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();

    credentials.forEach((credential) => {
      credential.tags.forEach((tag) => tags.add(tag));
    });

    return ["all", ...Array.from(tags).sort((a, b) => a.localeCompare(b))];
  }, [credentials]);

  const filteredCredentials = useMemo(() => {
    const q = search.toLowerCase().trim();

    return credentials.filter((item) => {
      const matchesSearch =
        !q ||
        item.serviceName.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesTag =
        selectedTag === "all" || item.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [credentials, search, selectedTag]);

  const handleCopyUsername = async (username: string) => {
    try {
      await copyUsername(username);
      setCopiedMessage("Username copied");
    } catch (error) {
      console.error("Copy username failed:", error);
      setCopiedMessage("Failed to copy username");
    }
  };

  const handleCopyPassword = async (encryptedPassword: string) => {
    try {
      await copyPassword(encryptedPassword);
      setCopiedMessage("Password copied");
    } catch (error) {
      console.error("Copy password failed:", error);
      setCopiedMessage("Failed to copy password");
    }
  };

  const handleDelete = async (id: string, serviceName: string) => {
    const confirmed = window.confirm(
      `Delete "${serviceName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteCredential(id);
    } catch (error) {
      console.error("Delete credential failed:", error);
    }
  };

  if (isLocked) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Vault</h1>
            <p className="mt-2 text-slate-400">
              Manage shared company credentials in one secure place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/vault/new"
              className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Add Credential
            </Link>

            <Link
              href="/settings"
              className="rounded-xl border border-slate-700 px-5 py-3 transition hover:bg-slate-900"
            >
              Settings
            </Link>

            <button
              type="button"
              onClick={lockVault}
              className="rounded-xl border border-slate-700 px-5 py-3 transition hover:bg-slate-900"
            >
              Lock Vault
            </button>
          </div>
        </div>

        {copiedMessage && (
          <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
            {copiedMessage}
          </div>
        )}

        {reusedIds.length > 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-700 bg-yellow-500/10 p-4 text-yellow-200">
            <p className="font-semibold">Password reuse warning</p>
            <p className="mt-1 text-sm text-yellow-100/80">
              Some passwords are used in multiple credentials. Reused passwords
              increase security risk across your team accounts.
            </p>
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-[2fr_1fr]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service, username, URL, note, or tag"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none transition focus:border-cyan-500"
          />

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none transition focus:border-cyan-500"
          >
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag === "all" ? "All tags" : tag}
              </option>
            ))}
          </select>
        </div>

        {credentials.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10">
            <h2 className="text-2xl font-semibold text-white">Your vault is empty</h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Start by adding your first company credential. You can organize
              entries with tags, copy usernames and passwords instantly, and
              spot reused passwords across the vault.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/vault/new"
                className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400"
              >
                Add your first credential
              </Link>

              <Link
                href="/settings"
                className="rounded-xl border border-slate-700 px-5 py-3 transition hover:bg-slate-950"
              >
                Open settings
              </Link>
            </div>
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            No credentials match your current search or filter.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCredentials.map((item) => (
              <CredentialCard
                key={item.id}
                id={item.id}
                serviceName={item.serviceName}
                url={item.url}
                username={item.username}
                tags={item.tags}
                reused={reusedIds.includes(item.id)}
                onCopyUsername={() => handleCopyUsername(item.username)}
                onCopyPassword={() => handleCopyPassword(item.encryptedPassword)}
                onDelete={() => handleDelete(item.id, item.serviceName)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
