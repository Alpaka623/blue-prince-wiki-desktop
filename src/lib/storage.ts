import { invoke } from "@tauri-apps/api/core";
import { Finding } from "./types";

export const storage = {
  async loadFindings(): Promise<Finding[]> {
    try {
      return await invoke<Finding[]>("load_findings");
    } catch (error) {
      console.error("Failed to load findings:", error);
      return [];
    }
  },

  async saveFindings(findings: Finding[]): Promise<void> {
    try {
      await invoke("save_findings", { findings });
    } catch (error) {
      console.error("Failed to save findings:", error);
      throw error;
    }
  },

  async uploadImage(name: string, base64Data: string): Promise<string> {
    try {
      return await invoke<string>("upload_image", { name, base64Data });
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
  },

  async deleteImage(name: string): Promise<void> {
    try {
      await invoke("delete_image", { name });
    } catch (error) {
      console.error("Failed to delete image:", error);
      throw error;
    }
  },

  async getAppDataDir(): Promise<string> {
    try {
      return await invoke<string>("get_app_data_dir");
    } catch (error) {
      console.error("Failed to get app data dir:", error);
      return "";
    }
  },

  async loadSettings(): Promise<any> {
    try {
      return await invoke<any>("load_settings");
    } catch (error) {
      console.error("Failed to load settings:", error);
      return {};
    }
  },

  async saveSettings(settings: any): Promise<void> {
    try {
      await invoke("save_settings", { settings });
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  }
};
