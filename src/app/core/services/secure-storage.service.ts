import { Injectable } from "@angular/core";
import { SecureStorageData } from "../models/secure-storage-data.model";

@Injectable({ providedIn: "root" })
export class SecureStorageService {
  private readonly SECRET = "mot-de-passe-très-long-et-complexe";
  private readonly SALT = new TextEncoder().encode("sel-statique-ou-généré"); // À changer
  private readonly ITERATIONS = 100000;
  private readonly ALGO = { name: "AES-GCM", length: 256 };

  private async getKey(): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(this.SECRET),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: this.SALT,
        iterations: this.ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      this.ALGO,
      false,
      ["encrypt", "decrypt"],
    );
  }

  private async encryptData(data: unknown): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.getKey();
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

    // On stocke IV + données chiffrées en base64
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));
    return `${ivBase64}:${cipherBase64}`;
  }

  private async decryptData(cipherText: string): Promise<unknown> {
    const [ivBase64, cipherBase64] = cipherText.split(":");
    const iv = new Uint8Array(
      atob(ivBase64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );
    const cipherBytes = new Uint8Array(
      atob(cipherBase64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );
    const key = await this.getKey();

    const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
    const decoded = new TextDecoder().decode(plainBuffer);
    return JSON.parse(decoded);
  }

  /**
   *
   * @param key
   * @param value
   * @param ttlMs
   */
  async setItem<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const item = { value, expiresAt: Date.now() + ttlMs };
    const encrypted = await this.encryptData(item);
    localStorage.setItem(key, encrypted);
  }

  /** Récupère un objet en vérifiant son expiration */
  async getItem<T>(key: string): Promise<T | null> {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    try {
      const item = (await this.decryptData(encrypted)) as SecureStorageData<T>;
      if (Date.now() > item.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value as T;
    } catch {
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
