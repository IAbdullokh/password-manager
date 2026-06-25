"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CredentialForm from "@/app/components/credential-form";
import { useVaultStore } from "@/store/vault-store";

export default function NewCredentialPage() {
  const router = useRouter();
  const isLocked = useVaultStore((state) => state.isLocked);

  useEffect(() => {
    if (isLocked) {
      router.push("/");
    }
  }, [isLocked, router]);

  if (isLocked) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#061b14] px-6 py-10 text-[#f5f1e8]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d5b14a]">
              Aegis Vault
            </div>
            <h1 className="text-4xl font-semibold text-[#f3eee3]">
              Add credential
            </h1>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-[#294438] px-5 py-3 text-sm text-[#b7c9be]"
          >
            Back
          </button>
        </div>

        <div className="rounded-[32px] border border-[#1d3a2d] bg-[#0b2119] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <CredentialForm mode="create" />
        </div>
      </div>
    </main>
  );
}
