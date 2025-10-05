const enc = new TextEncoder();
const dec = new TextDecoder();

export async function deriveKey(password, salt) {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(key, data) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
  const encoded = enc.encode(JSON.stringify(data));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    iv: Array.from(iv),
    cipher: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)))
  };
}


export async function decryptData(key, encrypted) {
  const { iv, cipher } = encrypted;
  const cipherBytes = Uint8Array.from(atob(cipher), c => c.charCodeAt(0));

  const plainBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    cipherBytes
  );

  return JSON.parse(dec.decode(plainBuffer));
}
