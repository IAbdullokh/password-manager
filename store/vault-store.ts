import { create } from "zustand";
import { Credential } from "@/types";
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
  lockVault: () => void;
  changeMasterPassword: (
    currentPassword: string,
    nextPassword: string
  ) => Promise<boolean>;

  addCredential: (credential: AddCredentialInput) => Promise<void>;
  updateCredential: (id: string, updates: CredentialFormInput) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;

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

export const useVaultStore = create<VaultStore>((set, get) => ({
  credentials: [],
  isLocked: true,
  masterPassword: null,
  hasMasterPassword: false,
  autoLockMinutes: 10,
  clearClipboardSeconds: 15,

  initialize: () => {
    const credentials = getCredentials();

    const savedAutoLock =
      typeof window !== "undefined"
        ? Number(localStorage.getItem(AUTO_LOCK_KEY) || 10)
        : 10;

    const savedClipboardClear =
      typeof window !== "undefined"
        ? Number(localStorage.getItem(CLIPBOARD_CLEAR_KEY) || 15)
        : 15;

    set({
      credentials,
      isLocked: true,
      masterPassword: null,
      hasMasterPassword: hasMasterPassword(),
      autoLockMinutes:
        Number.isFinite(savedAutoLock) && savedAutoLock > 0 ? savedAutoLock : 10,
      clearClipboardSeconds:
        Number.isFinite(savedClipboardClear) && savedClipboardClear > 0
          ? savedClipboardClear
          : 15,
    });
  },

  setLocked: (locked) => set({ isLocked: locked }),

  createMasterPassword: async (password) => {
    try {
      const hashed = await hashPassword(password);

      saveMasterPasswordHash(hashed);

      set({
        masterPassword: password,
        hasMasterPassword: true,
        isLocked: false,
      });
    } catch (error) {
      console.error("createMasterPassword failed:", error);
      throw error;
    }
  },

  unlockVault: async (password) => {
    try {
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
    } catch (error) {
      console.error("unlockVault failed:", error);
      throw error;
    }
  },

  lockVault: () => {
    set({
      isLocked: true,
      masterPassword: null,
    });
  },

  changeMasterPassword: async (currentPassword, nextPassword) => {
    try {
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
    } catch (error) {
      console.error("changeMasterPassword failed:", error);
      throw error;
    }
  },

  addCredential: async (credential) => {
    try {
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
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      };

      const updatedCredentials = [...credentials, credentialToSave];

      saveCredentials(updatedCredentials);
      set({ credentials: updatedCredentials });
    } catch (error) {
      console.error("addCredential failed:", error);
      throw error;
    }
  },

  updateCredential: async (id, updates) => {
    try {
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
              updatedAt: new Date().toISOString(),
            }
          : credential
      );

      saveCredentials(updatedCredentials);
      set({ credentials: updatedCredentials });
    } catch (error) {
      console.error("updateCredential failed:", error);
      throw error;
    }
  },

  deleteCredential: async (id) => {
    try {
      const updatedCredentials = get().credentials.filter(
        (item) => item.id !== id
      );

      saveCredentials(updatedCredentials);
      set({ credentials: updatedCredentials });
    } catch (error) {
      console.error("deleteCredential failed:", error);
      throw error;
    }
  },

  getCredentialById: (id) => {
    return get().credentials.find((credential) => credential.id === id);
  },

  copyUsername: async (username) => {
    try {
      await navigator.clipboard.writeText(username);

      const { clearClipboardSeconds } = get();

      window.setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
        } catch {
          // ignore clipboard clear errors
        }
      }, clearClipboardSeconds * 1000);
    } catch (error) {
      console.error("copyUsername failed:", error);
      throw error;
    }
  },

  copyPassword: async (encryptedPassword) => {
    try {
      const { masterPassword, clearClipboardSeconds } = get();

      if (!masterPassword) {
        throw new Error("Master password is missing.");
      }

      const plainPassword = await decryptText(encryptedPassword, masterPassword);
      await navigator.clipboard.writeText(plainPassword);

      window.setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
        } catch {
          // ignore clipboard clear errors
        }
      }, clearClipboardSeconds * 1000);
    } catch (error) {
      console.error("copyPassword failed:", error);
      throw error;
    }
  },

  getDecryptedPassword: async (encryptedPassword) => {
    try {
      const { masterPassword } = get();

      if (!masterPassword) {
        throw new Error("Master password is missing.");
      }

      return await decryptText(encryptedPassword, masterPassword);
    } catch (error) {
      console.error("getDecryptedPassword failed:", error);
      throw error;
    }
  },

  getAllDecryptedPasswords: async () => {
    try {
      const { credentials, masterPassword } = get();

      if (!masterPassword) {
        throw new Error("Master password is missing.");
      }

      return await Promise.all(
        credentials.map((credential) =>
          decryptText(credential.encryptedPassword, masterPassword)
        )
      );
    } catch (error) {
      console.error("getAllDecryptedPasswords failed:", error);
      throw error;
    }
  },

  getReusedCredentialIds: async () => {
    try {
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
    } catch (error) {
      console.error("getReusedCredentialIds failed:", error);
      throw error;
    }
  },

  isPasswordReused: async (encryptedPassword, excludeId) => {
    try {
      const { credentials, masterPassword } = get();

      if (!masterPassword) {
        throw new Error("Master password is missing.");
      }

      const targetPassword = await decryptText(encryptedPassword, masterPassword);

      let matchCount = 0;

      for (const credential of credentials) {
        if (excludeId && credential.id === excludeId) {
          continue;
        }

        const decrypted = await decryptText(
          credential.encryptedPassword,
          masterPassword
        );

        if (decrypted === targetPassword) {
          matchCount += 1;
        }

        if (matchCount > 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("isPasswordReused failed:", error);
      throw error;
    }
  },

  setAutoLockMinutes: (minutes) => {
  localStorage.setItem(AUTO_LOCK_KEY, String(minutes));
  console.log("Auto-lock minutes saved:", minutes);
  set({ autoLockMinutes: minutes });
},


  setClearClipboardSeconds: (seconds) => {
    localStorage.setItem(CLIPBOARD_CLEAR_KEY, String(seconds));
    set({ clearClipboardSeconds: seconds });
  },
}));
