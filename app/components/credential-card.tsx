"use client";

import Link from "next/link";

type CredentialCardProps = {
  id: string;
  serviceName: string;
  url: string;
  username: string;
  tags: string[];
  reused?: boolean;
  onCopyUsername: () => void;
  onCopyPassword: () => void;
  onDelete: () => void;
};

export default function CredentialCard({
  id,
  serviceName,
  url,
  username,
  tags,
  reused = false,
  onCopyUsername,
  onCopyPassword,
  onDelete,
}: CredentialCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-sm transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-white">
            {serviceName}
          </h3>

          <p className="mt-1 text-sm text-zinc-400">{username}</p>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-sm text-sky-400 hover:text-sky-300"
            >
              {url}
            </a>
          )}

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-500">Password</span>
            <span className="tracking-[0.3em] text-zinc-300">••••••••••••</span>
          </div>
        </div>

        {reused && (
          <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            Reused password
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopyUsername}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white transition hover:bg-zinc-700"
        >
          Copy username
        </button>

        <button
          type="button"
          onClick={onCopyPassword}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white transition hover:bg-zinc-700"
        >
          Copy password
        </button>

        <Link
          href={`/vault/edit/${id}`}
          className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white transition hover:bg-sky-500"
        >
          Edit
        </Link>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
