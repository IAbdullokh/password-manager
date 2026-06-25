import { create } from "zustand";
import { Credential, CredentialCategory } from "@/types";
import {
  getCredentials,
  getMasterPasswordHash,
  hasMasterPassword,
  saveCredentials,
  saveMasterPasswordHash,
} from "@/lib/storage";
import { decryptText, encryptText, hashPassword } from "@/lib/crypto";

export type CredentialFormInput = {
  serviceName: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
  tags: string[];
  category: CredentialCategory;
  favorite: boolean;
};

type AddCredentialInput = CredentialFormInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type VaultStore = {
  credentials: Credential[];
  isLocked: boolean;
  masterPassword: string | null;
  hasMasterPassword: boolean;
  autoLockMinutes: number;
  clearClipboardSeconds: number;

  initialize: () => void;
  setLocked: (locked: boolean) => void;
  createMasterPassword: (password: string) => Promise<void>;
  unlockVault: (password: string) => Promise<boolean>;
  verifyMasterPassword: (password: string) => Promise<boolean>;
  lockVault: () => void;
  resetVault: (password: string) => Promise<boolean>;
  changeMasterPassword: (
    currentPassword: string,
    nextPassword: string
  ) => Promise<boolean>;

  addCredential: (credential: AddCredentialInput) => Promise<void>;
  updateCredential: (id: string, updates: CredentialFormInput) => Promise<void>;
  deleteCredential: (id: string, password: string) => Promise<boolean>;
  toggleFavorite: (id: string) => void;

  getCredentialById: (id: string) => Credential | undefined;

  copyUsername: (username: string) => Promise<void>;
  copyPassword: (encryptedPassword: string) => Promise<void>;

  getDecryptedPassword: (encryptedPassword: string) => Promise<string>;
  getAllDecryptedPasswords: () => Promise<string[]>;
  getReusedCredentialIds: () => Promise<string[]>;
  isPasswordReused: (
    encryptedPassword: string,
    excludeId?: string
  ) => Promise<boolean>;

  setAutoLockMinutes: (minutes: number) => void;
  setClearClipboardSeconds: (seconds: number) => void;
};

const AUTO_LOCK_KEY = "vault_auto_lock_minutes";
const CLIPBOARD_CLEAR_KEY = "vault_clear_clipboard_seconds";
const CREDENTIALS_KEY = "vault_credentials";
const MASTER_PASSWORD_HASH_KEY = "vault_master_password_hash";

function normalizeCredential(item: Record<string, unknown>): Credential {
  return {
    id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
    serviceName: typeof item.serviceName === "string" ? item.serviceName : "",
    url: typeof item.url === "string" ? item.url : "",
    username: typeof item.username === "string" ? item.username : "",
    encryptedPassword:
      typeof item.encryptedPassword === "string" ? item.encryptedPassword : "",
    notes: typeof item.notes === "string" ? item.notes : "",
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    category:
      typeof item.category === "string" &&
      ["Internal", "Cloud", "Social", "Finance", "Dev", "Other"].includes(
        item.category
      )
        ? (item.category as CredentialCategory)
        : "Other",
    favorite: Boolean(item.favorite),
    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : new Date().toISOString(),
  };
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  credentials: [],
  isLocked: true,
  masterPassword: null,
  hasMasterPassword: false,
  autoLockMinutes: 5,
  clearClipboardSeconds: 15,

  initialize: () => {
    const credentials = getCredentials().map((item) =>
      normalizeCredential(item as Record<string, unknown>)
    );

    const savedAutoLock =
      typeof window !== "undefined"
        ? Number(localStorage.getItem(AUTO_LOCK_KEY) || 5)
        : 5;

    const savedClipboardClear =
      typeof window !== "undefined"
        ? Number(localStorage.getItem(CLIPBOARD_CLEAR_KEY) || 15)
        : 15;

    saveCredentials(credentials);

    set({
      credentials,
      isLocked: true,
      masterPassword: null,
      hasMasterPassword: hasMasterPassword(),
      autoLockMinutes:
        Number.isFinite(savedAutoLock) && savedAutoLock > 0 ? savedAutoLock : 5,
      clearClipboardSeconds:
        Number.isFinite(savedClipboardClear) && savedClipboardClear > 0
          ? savedClipboardClear
          : 15,
    });
  },

  setLocked: (locked) => set({ isLocked: locked }),

  createMasterPassword: async (password) => {
    const hashed = await hashPassword(password);

    saveMasterPasswordHash(hashed);

    set({
      masterPassword: password,
      hasMasterPassword: true,
      isLocked: false,
    });
  },

  unlockVault: async (password) => {
    const savedHash = getMasterPasswordHash();

    if (!savedHash) {
      throw new Error("No master password found.");
    }

    const inputHash = await hashPassword(password);

    if (inputHash === savedHash) {
      set({
        masterPassword: password,
        isLocked: false,
      });

      return true;
    }

    return false;
  },

  verifyMasterPassword: async (password) => {
    const savedHash = getMasterPasswordHash();

    if (!savedHash) {
      return false;
    }

    const inputHash = await hashPassword(password);
    return inputHash === savedHash;
  },

  lockVault: () => {
    set({
      isLocked: true,
      masterPassword: null,
    });
  },

  resetVault: async (password) => {
    const isValid = await get().verifyMasterPassword(password);

    if (!isValid) {
      return false;
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(CREDENTIALS_KEY);
      localStorage.removeItem(MASTER_PASSWORD_HASH_KEY);
    }

    set({
      credentials: [],
      isLocked: true,
      masterPassword: null,
      hasMasterPassword: false,
    });

    return true;
  },

  changeMasterPassword: async (currentPassword, nextPassword) => {
    const savedHash = getMasterPasswordHash();

    if (!savedHash) {
      throw new Error("No master password found.");
    }

    const currentHash = await hashPassword(currentPassword);

    if (currentHash !== savedHash) {
      return false;
    }

    const { credentials } = get();

    const reEncryptedCredentials = await Promise.all(
      credentials.map(async (credential) => {
        const plainPassword = await decryptText(
          credential.encryptedPassword,
          currentPassword
        );

        const reEncryptedPassword = await encryptText(
          plainPassword,
          nextPassword
        );

        return {
          ...credential,
          encryptedPassword: reEncryptedPassword,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const nextHash = await hashPassword(nextPassword);

    saveCredentials(reEncryptedCredentials);
    saveMasterPasswordHash(nextHash);

    set({
      credentials: reEncryptedCredentials,
      masterPassword: nextPassword,
      hasMasterPassword: true,
      isLocked: false,
    });

    return true;
  },

  addCredential: async (credential) => {
    const { masterPassword, credentials } = get();

    if (!masterPassword) {
      throw new Error("Master password is missing.");
    }

    const encryptedPassword = await encryptText(
      credential.password,
      masterPassword
    );

    const credentialToSave: Credential = {
      id: credential.id,
      serviceName: credential.serviceName.trim(),
      url: credential.url.trim(),
      username: credential.username.trim(),
      encryptedPassword,
      notes: credential.notes?.trim() || "",
      tags: credential.tags.map((tag) => tag.trim()).filter(Boolean),
      category: credential.category,
      favorite: credential.favorite,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    };

    const updatedCredentials = [...credentials, credentialToSave];

    saveCredentials(updatedCredentials);
    set({ credentials: updatedCredentials });
  },

  updateCredential: async (id, updates) => {
    const { credentials, masterPassword } = get();

    if (!masterPassword) {
      throw new Error("Master password is missing.");
    }

    const encryptedPassword = await encryptText(
      updates.password,
      masterPassword
    );

    const updatedCredentials = credentials.map((credential) =>
      credential.id === id
        ? {
            ...credential,
            serviceName: updates.serviceName.trim(),
            url: updates.url.trim(),
            username: updates.username.trim(),
            encryptedPassword,
            notes: updates.notes?.trim() || "",
            tags: updates.tags.map((tag) => tag.trim()).filter(Boolean),
            category: updates.category,
            favorite: updates.favorite,
            updatedAt: new Date().toISOString(),
          }
        : credential
    );

    saveCredentials(updatedCredentials);
    set({ credentials: updatedCredentials });
  },

  deleteCredential: async (id, password) => {
    const isValid = await get().verifyMasterPassword(password);

    if (!isValid) {
      return false;
    }

    const updatedCredentials = get().credentials.filter((item) => item.id !== id);

    saveCredentials(updatedCredentials);
    set({ credentials: updatedCredentials });

    return true;
  },

  toggleFavorite: (id) => {
    const updatedCredentials = get().credentials.map((item) =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );

    saveCredentials(updatedCredentials);
    set({ credentials: updatedCredentials });
  },

  getCredentialById: (id) => {
    return get().credentials.find((credential) => credential.id === id);
  },

  copyUsername: async (username) => {
    await navigator.clipboard.writeText(username);

    const { clearClipboardSeconds } = get();

    window.setTimeout(async () => {
      try {
        await navigator.clipboard.writeText("");
      } catch {}
    }, clearClipboardSeconds * 1000);
  },

  copyPassword: async (encryptedPassword) => {
    const { masterPassword, clearClipboardSeconds } = get();

    if (!masterPassword) {
      throw new Error("Master password is missing.");
    }

    const plainPassword = await decryptText(encryptedPassword, masterPassword);
    await navigator.clipboard.writeText(plainPassword);

    window.setTimeout(async () => {
      try {
        await navigator.clipboard.writeText("");
      } catch {}
    }, clearClipboardSeconds * 1000);
  },

  getDecryptedPassword: async (encryptedPassword) => {
    const { masterPassword } = get();

    if (!masterPassword) {
      throw new Error("Master password is missing.");
    }

    return await decryptText(encryptedPassword, masterPassword);
  },

  getAllDecryptedPasswords: async () => {
    const { credentials, masterPassword } = get();

    if (!masterPassword) {
      throw new Error("Master password is missing.");
    }

    return await Promise.all(
      credentials.map((credential) =>
        decryptText(credential.encryptedPassword, masterPassword)
      )
    );
  },

  getReusedCredentialIds: async () => {
    const { credentials, masterPassword } = get();

    if (!masterPassword) {
      throw new Error("Master password is missing.");
    }

    const decryptedPairs = await Promise.all(
      credentials.map(async (credential) => ({
        id: credential.id,
        password: await decryptText(
          credential.encryptedPassword,
          masterPassword
        ),
      }))
    );

    const passwordMap = new Map<string, string[]>();

    for (const item of decryptedPairs) {
      const existing = passwordMap.get(item.password) || [];
      existing.push(item.id);
      passwordMap.set(item.password, existing);
    }

    const reusedIds: string[] = [];

    for (const ids of passwordMap.values()) {
      if (ids.length > 1) {
        reusedIds.push(...ids);
      }
    }

    return reusedIds;
  },

  isPasswordReused: async (encryptedPassword, excludeId) => {
    const { credentials, masterPassword } = get();

    if (!masterPassword) {
      throw new Error("Master password is missing.");
    }

    const targetPassword = await decryptText(encryptedPassword, masterPassword);

    for (const credential of credentials) {
      if (excludeId && credential.id === excludeId) continue;

      const decrypted = await decryptText(
        credential.encryptedPassword,
        masterPassword
      );

      if (decrypted === targetPassword) {
        return true;
      }
    }

    return false;
  },

  setAutoLockMinutes: (minutes) => {
    localStorage.setItem(AUTO_LOCK_KEY, String(minutes));
    set({ autoLockMinutes: minutes });
  },

  setClearClipboardSeconds: (seconds) => {
    localStorage.setItem(CLIPBOARD_CLEAR_KEY, String(seconds));
    set({ clearClipboardSeconds: seconds });
  },
}));
