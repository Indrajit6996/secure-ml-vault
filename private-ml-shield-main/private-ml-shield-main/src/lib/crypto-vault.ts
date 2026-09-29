/**
 * Encrypted vault primitives — AES-256-GCM with PBKDF2-SHA256 key derivation.
 * Keys are derived in-memory from the passphrase and never persisted.
 */

const PBKDF2_ITERATIONS = 250_000;

export type VaultRecord = {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
  salt: string;
  iv: string;
  cipher: string;
};

const STORAGE_KEY = "ppml.vault.v1";

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPayload(
  passphrase: string,
  data: Uint8Array,
): Promise<{ salt: string; iv: string; cipher: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    data as BufferSource,
  );
  return { salt: toB64(salt), iv: toB64(iv), cipher: toB64(cipher) };
}

export async function decryptRecord(passphrase: string, rec: VaultRecord): Promise<Uint8Array> {
  const key = await deriveKey(passphrase, fromB64(rec.salt));
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(rec.iv) as BufferSource },
    key,
    fromB64(rec.cipher) as BufferSource,
  );
  return new Uint8Array(plain);
}

export function bytesToText(b: Uint8Array): string {
  return dec.decode(b);
}

export function textToBytes(s: string): Uint8Array {
  return enc.encode(s);
}

export function loadVault(): VaultRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VaultRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveVault(records: VaultRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function sha256Hex(data: Uint8Array): Promise<string> {
  return crypto.subtle
    .digest("SHA-256", data as BufferSource)
    .then((h) =>
      Array.from(new Uint8Array(h))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );
}

export const VAULT_PARAMS = {
  cipher: "AES-256-GCM",
  kdf: `PBKDF2-HMAC-SHA256 (${PBKDF2_ITERATIONS.toLocaleString()} iterations)`,
  iv: "96-bit random per record",
  salt: "128-bit random per record",
};
