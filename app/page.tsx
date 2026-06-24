"use client";

import { useEffect } from "react";
import LockScreen from "@/app/components/lock-screen";
import { useVaultStore } from "@/store/vault-store";
import VaultPage from "@/app/vault/page";

export default function HomePage() {
  const { isLocked, hasMasterPassword, initialize } = useVaultStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLocked) {
    return <LockScreen mode={hasMasterPassword ? "unlock" : "setup"} />;
  }

  return <VaultPage />;
}
