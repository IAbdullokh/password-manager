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

type AddCredentialInput = {
  id: string;
  serviceName: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type UpdateCredentialInput = {
  serviceName: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
  tags: string[];
};

type VaultStore = {
  credentials: Credential[];
  isLocked: boolean;
  masterPassword: string | null;
  hasMasterPassword: boolean;

  initialize: () => void;
  setLocked: (locked: boolean) => void;
  createMasterPassword: (password: string) => Promise<void>;
  unlockVault: (password: string) => Promise<boolean>;
  lockVault: () => void;
  addCredential: (credential: AddCredentialInput) => Promise<void>;
  updateCredential: (
    id: string,
    updates: UpdateCredentialInput
  ) => Promise<void>;
  deleteCredential: (id: string) => void;
  copyPassword: (encryptedPassword: string) => Promise<void>;
  getDecryptedPassword: (encryptedPassword: string) => Promise<string>;
  getAllDecryptedPasswords: () => Promise<string[]>;
};

export const useVaultStore = create<VaultStore>((set, get) => ({
  credentials: [],
  isLocked: true,
  masterPassword: null,
  hasMasterPassword: false,

  initialize: () => {
    const credentials = getCredentials();

    set({
      credentials,
      isLocked: true,
      masterPassword: null,
      hasMasterPassword: hasMasterPassword(),
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

  addCredential: async (credential) => {
    try {
      const { masterPassword } = get();

      if (!masterPassword) {
        throw new Error("Master password is missing.");
      }

      const encryptedPassword = await encryptText(
        credential.password,
        masterPassword
      );

      const credentialToSave: Credential = {
        id: credential.id,
        serviceName: credential.serviceName,
        url: credential.url,
        username: credential.username,
        encryptedPassword,
        notes: credential.notes,
        tags: credential.tags,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      };

      const updatedCredentials = [...get().credentials, credentialToSave];

      saveCredentials(updatedCredentials);

      set({
        credentials: updatedCredentials,
      });
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
              serviceName: updates.serviceName,
              url: updates.url,
              username: updates.username,
              encryptedPassword,
              notes: updates.notes ?? "",
              tags: updates.tags,
              updatedAt: new Date().toISOString(),
            }
          : credential
      );

      saveCredentials(updatedCredentials);

      set({
        credentials: updatedCredentials,
      });
    } catch (error) {
      console.error("updateCredential failed:", error);
      throw error;
    }
  },

  deleteCredential: (id) => {
    const updatedCredentials = get().credentials.filter(
      (item) => item.id !== id
    );

    saveCredentials(updatedCredentials);

    set({
      credentials: updatedCredentials,
    });
  },

  copyPassword: async (encryptedPassword) => {
    try {
      const { masterPassword } = get();

      if (!masterPassword) {
        throw new Error("Master password is missing.");
      }

      const plainPassword = await decryptText(encryptedPassword, masterPassword);
      await navigator.clipboard.writeText(plainPassword);
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

      const passwords = await Promise.all(
        credentials.map((credential) =>
          decryptText(credential.encryptedPassword, masterPassword)
        )
      );

      return passwords;
    } catch (error) {
      console.error("getAllDecryptedPasswords failed:", error);
      throw error;
    }
  },
}));
