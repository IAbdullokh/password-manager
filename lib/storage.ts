import { Credential } from "@/types";

const CREDENTIALS_KEY = "vault_credentials";
const MASTER_PASSWORD_HASH_KEY = "vault_master_password_hash";

export function getCredentials(): Credential[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(CREDENTIALS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveCredentials(credentials: Credential[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export function saveMasterPasswordHash(hash: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(MASTER_PASSWORD_HASH_KEY, hash);
}

export function getMasterPasswordHash(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(MASTER_PASSWORD_HASH_KEY);
}

export function hasMasterPassword(): boolean {
  if (typeof window === "undefined") return false;

  return !!localStorage.getItem(MASTER_PASSWORD_HASH_KEY);
}
