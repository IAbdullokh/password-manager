"use client";

import { useEffect, useRef } from "react";
import LockScreen from "@/app/components/lock-screen";
import VaultPage from "@/app/vault/page";
import { useVaultStore } from "@/store/vault-store";

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

export default function HomePage() {
  const initialize = useVaultStore((state) => state.initialize);
  const isLocked = useVaultStore((state) => state.isLocked);
  const hasMasterPassword = useVaultStore((state) => state.hasMasterPassword);
  const lockVault = useVaultStore((state) => state.lockVault);
  const autoLockMinutes = useVaultStore((state) => state.autoLockMinutes);

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLocked || !hasMasterPassword) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const timeoutMs = autoLockMinutes * 60 * 1000;

    const resetTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        lockVault();
      }, timeoutMs);
    };

    resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLocked, hasMasterPassword, autoLockMinutes, lockVault]);

  if (isLocked) {
    return <LockScreen mode={hasMasterPassword ? "unlock" : "setup"} />;
  }

  return <VaultPage />;
}
  