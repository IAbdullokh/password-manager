"use client";

import { useState } from "react";
import { getPasswordReuseCount } from "@/lib/reuse-detection";

type CredentialFormProps = {
  existingPasswords: string[];
};

export default function CredentialForm({
  existingPasswords,
}: CredentialFormProps) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const reuseCount = getPasswordReuseCount(password, existingPasswords);
  const isReused = reuseCount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCredential = {
      title,
      username,
      password,
    };

    console.log(newCredential);

    setTitle("");
    setUsername("");
    setPassword("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Website / App
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-sky-500"
          placeholder="Enter website or app name"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">
          Username / Email
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-sky-500"
          placeholder="Enter username or email"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-sky-500"
          placeholder="Enter password"
        />
      </div>

      {isReused && (
        <p className="text-sm font-medium text-red-400">
          Warning: this password is already used in {reuseCount} other
          credential{reuseCount > 1 ? "s" : ""}.
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-500"
      >
        Save Credential
      </button>
    </form>
  );
}
