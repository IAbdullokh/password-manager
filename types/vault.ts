export type Credential = {
  id: string;
  serviceName: string;
  url: string;
  username: string;
  encryptedPassword: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
 