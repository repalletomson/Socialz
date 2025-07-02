import CryptoJS from "crypto-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

class EncryptionService {
  constructor() {
    this.initialized = false;
    this.encryptionKey = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      let key = await this.getStoredKey();

      if (!key) {
        key = this.generateKey();
        await this.storeKey(key);
      }

      this.encryptionKey = key;
      this.initialized = true;
    } catch (error) {
      console.error("Encryption initialization error:", error);
      throw new Error("Failed to initialize encryption service");
    }
  }

  generateKey() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getStoredKey() {
    try {
      if (Platform.OS === "ios") {
        return await SecureStore.getItemAsync("encryptionKey");
      } else {
        return await AsyncStorage.getItem("encryptionKey");
      }
    } catch (error) {
      console.error("Error retrieving encryption key:", error);
      return null;
    }
  }

  async storeKey(key) {
    try {
      if (Platform.OS === "ios") {
        await SecureStore.setItemAsync("encryptionKey", key);
      } else {
        await AsyncStorage.setItem("encryptionKey", key);
      }
    } catch (error) {
      console.error("Error storing encryption key:", error);
      throw new Error("Failed to store encryption key");
    }
  }

  async encryptText(text) {
    if (!this.initialized) await this.initialize();

    try {
      if (!this.encryptionKey) throw new Error("Encryption key not initialized");
      return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt text");
    }
  }

  async decryptText(encryptedText) {
    if (!this.initialized) await this.initialize();

    try {
      if (!this.encryptionKey) throw new Error("Encryption key not initialized");
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("Decryption error:", error);
      return "[Encrypted message]";
    }
  }

  async encryptImage(base64Image) {
    if (!this.initialized) await this.initialize();

    try {
      if (!this.encryptionKey) throw new Error("Encryption key not initialized");
      return CryptoJS.AES.encrypt(base64Image, this.encryptionKey).toString();
    } catch (error) {
      console.error("Image encryption error:", error);
      throw new Error("Failed to encrypt image");
    }
  }

  async decryptImage(encryptedImage) {
    if (!this.initialized) await this.initialize();

    try {
      if (!this.encryptionKey) throw new Error("Encryption key not initialized");
      const bytes = CryptoJS.AES.decrypt(encryptedImage, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("Image decryption error:", error);
      return null;
    }
  }
}

const encryptionService = new EncryptionService();
export default encryptionService;
