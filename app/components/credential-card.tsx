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
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{serviceName}</h3>
          <p className="text-sm text-zinc-400">{username}</p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {url}
            </a>
          )}
        </div>

        {reused && (
          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-300">
            Reused password
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onCopyUsername}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700"
        >
          Copy username
        </button>

        <button
          onClick={onCopyPassword}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white hover:bg-zinc-700"
        >
          Copy password
        </button>

        <Link
          href={`/vault/edit/${id}`}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
        >
          Edit
        </Link>

        <button
          onClick={onDelete}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
