import { sha256Sync } from '@/infra/auth/sha256Sync';

function base64urlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array);
}

async function sha256Bytes(plain: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(plain);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(digest);
  }
  return sha256Sync(data);
}

export async function generateCodeChallengeFromVerifier(codeVerifier: string): Promise<string> {
  const hashed = await sha256Bytes(codeVerifier);
  return base64urlEncode(hashed);
}
