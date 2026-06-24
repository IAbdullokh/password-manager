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
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <CredentialForm mode="create" />
    </main>
  );
}
