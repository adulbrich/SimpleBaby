import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as aesjs from "aes-js";
import * as SecureStore from "expo-secure-store";
import * as ExpoCrypto from "expo-crypto";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";

// https://stackoverflow.com/questions/76389249/provided-value-to-securestore-is-larger-than-2048-bytes-while-trying-to-store

class LargeSecureStore {
    private async _encrypt(key: string, value: string) {
        try {
            const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));

            const cipher = new aesjs.ModeOfOperation.ctr(
                encryptionKey,
                new aesjs.Counter(1)
            );
            const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

            await SecureStore.setItemAsync(
                key,
                aesjs.utils.hex.fromBytes(encryptionKey)
            );

            return aesjs.utils.hex.fromBytes(encryptedBytes);
        } catch (error) {
            console.error("Encryption error:", error);
            throw error;
        }
    }

    private async _decrypt(key: string, value: string) {
        try {
            const encryptionKeyHex = await SecureStore.getItemAsync(key);
            if (!encryptionKeyHex) {
                return encryptionKeyHex;
            }

            const cipher = new aesjs.ModeOfOperation.ctr(
                aesjs.utils.hex.toBytes(encryptionKeyHex),
                new aesjs.Counter(1)
            );
            const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));

            return aesjs.utils.utf8.fromBytes(decryptedBytes);
        } catch (error) {
            console.error("Encryption error:", error);
            throw error;
        }
    }

    async getItem(key: string) {
        const encrypted = await AsyncStorage.getItem(key);
        if (!encrypted) {
            return encrypted;
        }

        return await this._decrypt(key, encrypted);
    }

    async removeItem(key: string) {
        await AsyncStorage.removeItem(key);
        await SecureStore.deleteItemAsync(key);
    }

    async setItem(key: string, value: string) {
        const encrypted = await this._encrypt(key, value);

        await AsyncStorage.setItem(key, encrypted);
    }
}

/**
 * Generate and persist a new 32-byte (256-bit) key as hex.
 */
async function createEncryptionKey(): Promise<string> {
    const bytes = await ExpoCrypto.getRandomBytesAsync(32);       // 32 bytes = 256-bit
    const hex = Buffer.from(bytes).toString("hex");               // store as hex string
    await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, hex);
    return hex;
}

// Define a constant key name
const ENCRYPTION_KEY_NAME = "ENCRYPTION_KEY";

/**
 * Retrieves the stored encryption key.
 */
export const getEncryptionKey = async (): Promise<string | null> => {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
    if (!key) {
        key = await createEncryptionKey();
    }
    return key;
};

const PUBLIC_ANON = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

if (!PUBLIC_ANON || !SUPABASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY');
}

// NOTE: This code has been commented out for causing linting warnings.
// We should keep it in the file for the time being in case it is needed in future use.
// ***************************************************
// const secureStoreAdapter = {
//     async getItem(key: string) {
//         return await SecureStore.getItemAsync(key);
//     },
//     async setItem(key: string, value: string) {
//         await SecureStore.setItemAsync(key, value);
//     },
//     async removeItem(key: string) {
//         await SecureStore.deleteItemAsync(key);
//     },
// };

const supabase = createClient(SUPABASE_URL, PUBLIC_ANON, {
    auth: {
        storage: new LargeSecureStore(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export default supabase;
