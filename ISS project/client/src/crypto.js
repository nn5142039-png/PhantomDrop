/**
 * Phantom Drop — Crypto Core
 * 
 * Client-side encryption using PBKDF2 (KDF) + AES-256-GCM (cipher).
 * Uses ONLY the Web Crypto API — zero external dependencies.
 * The passphrase and derived key NEVER leave the browser.
 */

const PBKDF2_ITERATIONS = 600000; // OWASP 2023 recommendation
const SALT_LENGTH = 16;           // 128-bit salt
const IV_LENGTH = 12;             // 96-bit IV for GCM
const KEY_LENGTH = 256;           // AES-256

/**
 * Convert ArrayBuffer / Uint8Array to Base64 string
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive a 256-bit AES key from passphrase + salt using PBKDF2-SHA256.
 * Returns a CryptoKey ready for AES-GCM encrypt/decrypt.
 */
async function deriveKey(passphrase, salt, usages) {
  const encoder = new TextEncoder();

  // Import passphrase as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-256-GCM key via PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    usages
  );
}

/**
 * Encrypt a plaintext note with a passphrase.
 * Returns: { ciphertext, iv, salt } — all Base64-encoded.
 */
export async function encryptNote(plaintext, passphrase) {
  const encoder = new TextEncoder();

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key from passphrase
  const cryptoKey = await deriveKey(passphrase, salt, ['encrypt']);

  // Encrypt (AES-256-GCM automatically appends the 128-bit auth tag)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

/**
 * Decrypt ciphertext using a passphrase and the stored salt/IV.
 * All inputs are Base64-encoded strings.
 * Returns the plaintext string.
 * Throws if passphrase is wrong or data is tampered (GCM auth tag verification).
 */
export async function decryptNote(ciphertextB64, ivB64, saltB64, passphrase) {
  const ciphertext = base64ToBuffer(ciphertextB64);
  const iv = base64ToBuffer(ivB64);
  const salt = base64ToBuffer(saltB64);

  // Re-derive the same key from passphrase + salt
  const cryptoKey = await deriveKey(passphrase, salt, ['decrypt']);

  // Decrypt (GCM verifies the auth tag automatically — throws on tamper/wrong key)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
