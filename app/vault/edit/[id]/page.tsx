"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CredentialForm from "@/app/components/credential-form";
import { Credential } from "@/types";
import { useVaultStore } from "@/store/vault-store";

export default function EditCredentialPage() {
  const router = useRouter();
  const params = useParams();

  const isLocked = useVaultStore((state) => state.isLocked);
  const getCredentialById = useVaultStore((state) => state.getCredentialById);
  const getDecryptedPassword = useVaultStore((state) => state.getDecryptedPassword);

  const [credential, setCredential] = useState<Credential | null>(null);
  const [decryptedPassword, setDecryptedPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLocked) {
      router.push("/");
      return;
    }

    const id = params.id as string;
    const found = getCredentialById(id);

    if (!found) {
      router.push("/vault");
      return;
    }

    const loadPassword = async () => {
      try {
        const plainPassword = await getDecryptedPassword(found.encryptedPassword);
        setCredential(found);
        setDecryptedPassword(plainPassword);
      } catch (error) {
        console.error("Failed to load credential password:", error);
        router.push("/vault");
      } finally {
        setLoading(false);
      }
    };

    loadPassword();
  }, [isLocked, router, params.id, getCredentialById, getDecryptedPassword]);

  if (isLocked || loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm text-zinc-400">Loading credential...</p>
        </div>
      </main>
    );
  }

  if (!credential) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <CredentialForm
        mode="edit"
        credential={credential}
        decryptedPassword={decryptedPassword}
      />
    </main>
  );
}
