export type CredentialCategory =
  | "Internal"
  | "Cloud"
  | "Social"
  | "Finance"
  | "Dev"
  | "Other";

export type Credential = {
  id: string;
  serviceName: string;
  url: string;
  username: string;
  encryptedPassword: string;
  notes?: string;
  tags: string[];
  category: CredentialCategory;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};
