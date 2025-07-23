import fs from "fs";
import path from "path";
import os from "os";

import {
  Theme,
  LaunchTextConfig,
  ThinkingVerbsConfig,
  ThinkingStyleConfig,
} from "../types.js";

export interface TweakCCConfig {
  ccVersion: string;
  lastModified: string;
  changesApplied?: boolean;
  settings?: {
    themes?: Theme[];
    activeTheme?: string;
    launchText?: LaunchTextConfig;
    thinkingVerbs?: ThinkingVerbsConfig;
    thinkingStyle?: ThinkingStyleConfig;
  };
}

const CONFIG_DIR = path.join(os.homedir(), ".tweakcc");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const CLI_BACKUP_FILE = path.join(CONFIG_DIR, "cli.js.backup");

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfig(): TweakCCConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading config:", error);
  }
  return null;
}

export function saveConfig(config: TweakCCConfig): void {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Error saving config:", error);
    throw error;
  }
}

export function createBackup(sourcePath: string, version: string): void {
  process.stdout.write("Backing up Claude Code's cli.js\r");
  try {
    ensureConfigDir();
    fs.copyFileSync(sourcePath, CLI_BACKUP_FILE);

    const config: TweakCCConfig = {
      ccVersion: version,
      lastModified: new Date().toISOString(),
      changesApplied: false,
    };
    saveConfig(config);
  } catch (error) {
    console.error("Error copying cli.js:", error);
    throw error;
  }
}

export function getBackupCliPath(): string {
  return CLI_BACKUP_FILE;
}

export function backupCliExists(): boolean {
  return fs.existsSync(CLI_BACKUP_FILE);
}

export function restoreFromBackup(originalCliPath: string): boolean {
  try {
    if (!backupCliExists()) {
      return false;
    }

    // Copy backup back to original location
    fs.copyFileSync(CLI_BACKUP_FILE, originalCliPath);

    // Update config to reflect restored state
    const config = getConfig();
    if (config) {
      config.changesApplied = false;
      config.lastModified = new Date().toISOString();
      saveConfig(config);
    }

    return true;
  } catch (error) {
    console.error("Error restoring from backup:", error);
    return false;
  }
}

export function getConfigCcVersion(): string | null {
  const config = getConfig();
  return config?.ccVersion || null;
}

export function getChangesApplied(): boolean {
  const config = getConfig();
  return config?.changesApplied ?? true;
}

export function setChangesApplied(value: boolean): void {
  const config = getConfig();
  if (config) {
    config.changesApplied = value;
    saveConfig(config);
  }
}

export function saveThemesToConfig(themes: Theme[]): void {
  const config = getConfig() || {
    ccVersion: "",
    lastModified: new Date().toISOString(),
  };
  if (!config.settings) config.settings = {};
  config.settings.themes = themes;
  config.lastModified = new Date().toISOString();
  saveConfig(config);
}

export function saveLaunchTextToConfig(
  launchTextConfig: LaunchTextConfig
): void {
  const config = getConfig() || {
    ccVersion: "",
    lastModified: new Date().toISOString(),
  };
  if (!config.settings) config.settings = {};
  config.settings.launchText = launchTextConfig;
  config.lastModified = new Date().toISOString();
  saveConfig(config);
}

export function saveThinkingVerbsToConfig(
  thinkingVerbsConfig: ThinkingVerbsConfig
): void {
  const config = getConfig() || {
    ccVersion: "",
    lastModified: new Date().toISOString(),
  };
  if (!config.settings) config.settings = {};
  config.settings.thinkingVerbs = thinkingVerbsConfig;
  config.lastModified = new Date().toISOString();
  saveConfig(config);
}

export function saveThinkingStyleToConfig(
  thinkingStyleConfig: ThinkingStyleConfig
): void {
  const config = getConfig() || {
    ccVersion: "",
    lastModified: new Date().toISOString(),
  };
  if (!config.settings) config.settings = {};
  config.settings.thinkingStyle = thinkingStyleConfig;
  config.lastModified = new Date().toISOString();
  saveConfig(config);
}

export function getThemesFromConfig(): Theme[] | null {
  const config = getConfig();
  return config?.settings?.themes || null;
}

export function getLaunchTextFromConfig(): LaunchTextConfig | null {
  const config = getConfig();
  return config?.settings?.launchText || null;
}

export function getThinkingVerbsFromConfig(): ThinkingVerbsConfig | null {
  const config = getConfig();
  return config?.settings?.thinkingVerbs || null;
}

export function getThinkingStyleFromConfig(): ThinkingStyleConfig | null {
  const config = getConfig();
  return config?.settings?.thinkingStyle || null;
}
