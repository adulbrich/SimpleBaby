import CryptoES from 'crypto-es';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer'; // ✅ Import Buffer polyfill
import { getEncryptionKey } from './supabase-client';

/**
 * Generates a 16-byte IV using Expo's Crypto API.
 */
const getIV = async (): Promise<Uint8Array> => {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return new Uint8Array(randomBytes);
};

/**
 * Hashes the encryption key using SHA-256 (fast alternative to PBKDF2).
 */
const getHashedKey = async (): Promise<string> => {
    const key = await getEncryptionKey();
    if (!key) throw new Error('❌ Encryption key not found');

    // Use SHA-256 instead of PBKDF2 (async, non-blocking)
    return CryptoES.SHA256(key).toString(CryptoES.enc.Hex);
};

/**
 * Encrypts data using AES-256-CBC encryption.
 */
export const encryptData = async (data: string): Promise<string> => {
    const hashedKey = await getHashedKey();

    // Generate a random IV (16 bytes for AES)
    const ivBytes = await getIV();
    const ivHex = CryptoES.enc.Hex.parse(Buffer.from(ivBytes).toString('hex'));

    // Encrypt the data
    const encrypted = CryptoES.AES.encrypt(data, hashedKey, {
        iv: ivHex,
        mode: CryptoES.mode.CBC,
        padding: CryptoES.pad.Pkcs7,
    }).toString();

    // Store IV + ciphertext
    const encryptedData = Buffer.from(ivBytes).toString('hex') + encrypted;
    console.log('🔒 Encrypted Data:', encryptedData);
    return encryptedData;
};

/**
 * Decrypts AES-256-CBC encrypted data.
 */
export const decryptData = async (ciphertext: string): Promise<string> => {
    const hashedKey = await getHashedKey();

    // Extract the IV (first 32 hex characters)
    const ivHex = ciphertext.substring(0, 32);
    const encryptedText = ciphertext.substring(32);

    // Decrypt the data
    const decrypted = CryptoES.AES.decrypt(encryptedText, hashedKey, {
        iv: CryptoES.enc.Hex.parse(ivHex),
        mode: CryptoES.mode.CBC,
        padding: CryptoES.pad.Pkcs7,
    }).toString(CryptoES.enc.Utf8);

    if (!decrypted) throw new Error('❌ Decryption failed');
    console.log('🔑 Decrypted Data:', decrypted);
    return decrypted;
};

export default {
    encryptData,
    decryptData,
};
