const encoder = new TextEncoder();
const decoder = new TextDecoder();

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function hashPassword(password: string): Promise<string> {
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function encryptText(
  plainText: string,
  password: string
): Promise<string> {
  const salt: Uint8Array<ArrayBuffer> = crypto.getRandomValues(
    new Uint8Array(16)
  ) as Uint8Array<ArrayBuffer>;

  const iv: Uint8Array<ArrayBuffer> = crypto.getRandomValues(
    new Uint8Array(12)
  ) as Uint8Array<ArrayBuffer>;

  const key = await deriveKey(password, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  );

  return JSON.stringify({
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    data: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
  });
}

export async function decryptText(
  encryptedText: string,
  password: string
): Promise<string> {
  const parsed = JSON.parse(encryptedText);

  const salt: Uint8Array<ArrayBuffer> = base64ToUint8Array(parsed.salt);
  const iv: Uint8Array<ArrayBuffer> = base64ToUint8Array(parsed.iv);
  const data: Uint8Array<ArrayBuffer> = base64ToUint8Array(parsed.data);

  const key = await deriveKey(password, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  return decoder.decode(decryptedBuffer);
}
