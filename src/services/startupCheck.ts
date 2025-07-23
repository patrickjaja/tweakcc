import { findClijs, getSearchedLocations } from './cliDetector.js';
import {
  backupCliExists,
  getConfigCcVersion,
  createBackup,
} from './configManager.js';

export interface StartupCheckResult {
  success: boolean;
  needsUpdate?: boolean;
  currentVersion?: string;
  cachedVersion?: string;
  error?: string;
  cliPath?: string;
}

export async function checkClijs(): Promise<StartupCheckResult> {
  try {
    // Find Claude Code installation
    const claudePaths = findClijs();
    if (!claudePaths) {
      return {
        success: false,
        error: `Cannot find Claude Code's cli.js -- do you have Claude Code installed?\n\nSearched at the following locations:\n${getSearchedLocations()}\n\nIf you have it installed but it's in a location not listed above, please open an issue at\nhttps://github.com/piebald-ai/tweakcc/issues and tell us where you have it--we'll add that\nlocation to our search list and release an update today!`,
      };
    }

    const realVersion = claudePaths.version;
    const cachedVersion = getConfigCcVersion();

    // If backup doesn't exist, create backup for the first time
    if (!backupCliExists()) {
      createBackup(claudePaths.cliPath, realVersion);
      return {
        success: true,
        currentVersion: realVersion,
        cachedVersion: realVersion,
        cliPath: claudePaths.cliPath,
      };
    }

    // Check if versions differ
    if (realVersion !== cachedVersion) {
      return {
        success: true,
        needsUpdate: true,
        currentVersion: realVersion,
        cachedVersion: cachedVersion || undefined,
        cliPath: claudePaths.cliPath,
      };
    }

    // All good, no update needed
    return {
      success: true,
      currentVersion: realVersion,
      cachedVersion: cachedVersion,
      cliPath: claudePaths.cliPath,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error during startup check: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

export function handleVersionUpdate(): StartupCheckResult {
  try {
    const claudePaths = findClijs();
    if (!claudePaths) {
      return {
        success: false,
        error: 'Could not find Claude Code installation for update',
      };
    }

    // Always create new backup
    createBackup(claudePaths.cliPath, claudePaths.version);

    return {
      success: true,
      currentVersion: claudePaths.version,
      cachedVersion: claudePaths.version,
      cliPath: claudePaths.cliPath,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error updating CLI: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
