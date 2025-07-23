import React, { useState, useEffect } from "react";
import { Box, useInput, Text } from "ink";
import { spawn } from "child_process";
import { existsSync, writeFileSync, mkdirSync, readFileSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import figlet from "figlet";
import { MainView } from "./components/MainView.js";
import { ThemesView } from "./components/ThemesView.js";
import { ThemeEditView } from "./components/ThemeEditView.js";
import { LaunchTextView } from "./components/LaunchTextView.js";
import { ThinkingVerbsView } from "./components/ThinkingVerbsView.js";
import { ThinkingStyleView } from "./components/ThinkingStyleView.js";
import {
  AppState,
  ViewType,
  Theme,
  LaunchTextConfig,
  ThinkingVerbsConfig,
  ThinkingStyleConfig,
} from "./types.js";
import { themes } from "./themes.js";
import { checkClijs, handleVersionUpdate } from "./services/startupCheck.js";
import {
  writeSigninBannerText,
  writeThemes,
  writeThinkerSymbolChars,
  writeThinkerSymbolSpeed,
  writeUseHaikuVerbs,
  writeThinkerVerbs,
  writeThinkerPunctuation,
  writeThinkerSymbolMirrorOption,
} from "./services/cliModifier.js";
import {
  getBackupCliPath,
  getConfig,
  getChangesApplied,
  setChangesApplied,
  saveThemesToConfig,
  saveLaunchTextToConfig,
  saveThinkingVerbsToConfig,
  restoreFromBackup,
  saveThinkingStyleToConfig,
  getThemesFromConfig,
  getLaunchTextFromConfig,
  getThinkingVerbsFromConfig,
  getThinkingStyleFromConfig,
} from "./services/configManager.js";
import { findClijs } from "./services/cliDetector.js";

export default function App() {
  const [state, setState] = useState<AppState>({
    currentView: "main",
    selectedMainIndex: 0,
    selectedThemeIndex: 0,
  });
  const [currentThemes, setCurrentThemes] = useState<Theme[]>(themes);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [cliPath, setCliPath] = useState<string | null>(null);
  const [updateNotification, setUpdateNotification] = useState<string | null>(
    null
  );
  const [changesApplied, setChangesAppliedState] = useState<boolean>(true);

  // Startup check
  useEffect(() => {
    const performStartupCheck = async () => {
      const result = await checkClijs();

      if (!result.success) {
        setStartupError(result.error || "Unknown error during startup");
        return;
      }

      if (result.needsUpdate) {
        setUpdateNotification(
          "Claude Code version update available. Applying update..."
        );
        const updateResult = handleVersionUpdate(true);
        if (updateResult.success && updateResult.cliPath) {
          setCliPath(updateResult.cliPath);
          setUpdateNotification("Claude Code updated successfully!");
          setTimeout(() => setUpdateNotification(null), 3000);
        } else {
          setUpdateNotification("Update failed. Please try again.");
          setTimeout(() => setUpdateNotification(null), 5000);
        }
      } else {
        setCliPath(result.cliPath || null);
      }

      // Initialize changesApplied state
      setChangesAppliedState(getChangesApplied());

      // Load settings from config
      const savedThemes = getThemesFromConfig();
      if (savedThemes) {
        setCurrentThemes(savedThemes);
      }

      const savedLaunchText = getLaunchTextFromConfig();
      if (savedLaunchText) {
        setState((prev) => ({ ...prev, launchTextConfig: savedLaunchText }));
      }

      const savedThinkingVerbs = getThinkingVerbsFromConfig();
      if (savedThinkingVerbs) {
        setState((prev) => ({
          ...prev,
          thinkingVerbsConfig: savedThinkingVerbs,
        }));
      }

      const savedThinkingStyle = getThinkingStyleFromConfig();
      if (savedThinkingStyle) {
        setState((prev) => ({
          ...prev,
          thinkingStyleConfig: savedThinkingStyle,
        }));
      }
    };

    performStartupCheck();
  }, []);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      process.exit(0);
    }
    if (
      (input === "q" || key.escape) &&
      !state.editingColor &&
      state.currentView === "main"
    ) {
      process.exit(0);
    }
  });

  const markChangesUnapplied = () => {
    setChangesApplied(false);
    setChangesAppliedState(false);
  };

  const handleRestoreOriginalClaude = async () => {
    try {
      if (!cliPath) {
        setUpdateNotification("No CLI path found.");
        setTimeout(() => setUpdateNotification(null), 5000);
        return;
      }

      const success = restoreFromBackup(cliPath);
      if (success) {
        setChangesAppliedState(false);
        setUpdateNotification("Original Claude Code restored successfully!");
        setTimeout(() => setUpdateNotification(null), 3000);
      } else {
        setUpdateNotification(
          "Failed to restore - no backup found or restore error."
        );
        setTimeout(() => setUpdateNotification(null), 5000);
      }
    } catch (error) {
      setUpdateNotification("Error restoring original Claude Code.");
      setTimeout(() => setUpdateNotification(null), 5000);
    }
  };

  const handleOpenTweakccConfig = () => {
    try {
      const configPath = join(homedir(), ".tweakcc", "config.json");

      // Check if config file exists
      if (!existsSync(configPath)) {
        setUpdateNotification(
          "Config file not found. Creating default config..."
        );
        // Create directory if it doesn't exist
        const configDir = dirname(configPath);
        if (!existsSync(configDir)) {
          mkdirSync(configDir, { recursive: true });
        }
        // Create basic config file
        writeFileSync(configPath, JSON.stringify({}, null, 2));
      }

      if (process.platform === "win32") {
        spawn("explorer", ["/select,", configPath], {
          detached: true,
          stdio: "ignore",
        }).unref();
      } else if (process.platform === "darwin") {
        spawn("open", ["-R", configPath], {
          detached: true,
          stdio: "ignore",
        }).unref();
      } else {
        const configDir = dirname(configPath);
        spawn("xdg-open", [configDir], {
          detached: true,
          stdio: "ignore",
        }).unref();
      }

      setUpdateNotification(
        "Opening file browser with tweakcc.json selected..."
      );
      setTimeout(() => setUpdateNotification(null), 2000);
    } catch (error) {
      setUpdateNotification(
        `Failed to open tweakcc.json: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setTimeout(() => setUpdateNotification(null), 3000);
    }
  };

  const handleApplyChanges = () => {
    if (!cliPath) {
      setUpdateNotification("No CLI path found. Cannot apply changes.");
      setTimeout(() => setUpdateNotification(null), 3000);
      return;
    }

    let content = readFileSync(cliPath, "utf8");
    let changesMade = false;

    // Apply themes
    const savedThemes = getThemesFromConfig();
    if (savedThemes && savedThemes.length > 0) {
      const result = writeThemes(content, savedThemes);
      if (result) {
        content = result;
        changesMade = true;
      } else {
        console.log("❌ Themes: Failed to find location in CLI file");
      }
    }

    // Apply launch text
    const savedLaunchText = getLaunchTextFromConfig();
    if (savedLaunchText) {
      let textToApply = "";

      if (savedLaunchText.method === "custom" && savedLaunchText.customText) {
        textToApply = savedLaunchText.customText;
      } else if (
        savedLaunchText.method === "figlet" &&
        savedLaunchText.figletText
      ) {
        try {
          textToApply = figlet.textSync(
            savedLaunchText.figletText.replace("\n", " "),
            {
              font: savedLaunchText.figletFont as any,
            }
          );
        } catch (error) {
          console.log("❌ Launch Text: Failed to generate figlet text");
        }
      }

      if (textToApply) {
        const result = writeSigninBannerText(content, textToApply);
        if (result) {
          content = result;
          changesMade = true;
        } else {
          console.log("❌ Launch Text: Failed to find location in CLI file");
        }
      }
    }

    // Apply thinking verbs
    const savedThinkingVerbs = getThinkingVerbsFromConfig();
    if (savedThinkingVerbs) {
      const haikuResult = writeUseHaikuVerbs(
        content,
        savedThinkingVerbs.useHaikuGenerated
      );
      if (haikuResult) {
        content = haikuResult;
      } else {
        console.log("❌ Use Haiku Verbs: Failed to find location in CLI file");
      }

      const verbsResult = writeThinkerVerbs(content, savedThinkingVerbs.verbs);
      if (verbsResult) {
        content = verbsResult;
      } else {
        console.log("❌ Thinker Verbs: Failed to find location in CLI file");
      }

      const punctResult = writeThinkerPunctuation(
        content,
        savedThinkingVerbs.punctuation
      );
      if (punctResult) {
        content = punctResult;
      } else {
        console.log(
          "❌ Thinker Punctuation: Failed to find location in CLI file"
        );
      }
      changesMade = true;
    }

    // Apply thinking style
    const savedThinkingStyle = getThinkingStyleFromConfig();
    if (savedThinkingStyle) {
      const charsResult = writeThinkerSymbolChars(
        content,
        savedThinkingStyle.phases
      );
      if (charsResult) {
        content = charsResult;
      } else {
        console.log(
          "❌ Thinker Symbol Chars: Failed to find location in CLI file"
        );
      }

      const speedResult = writeThinkerSymbolSpeed(
        content,
        savedThinkingStyle.updateInterval
      );
      if (speedResult) {
        content = speedResult;
      } else {
        console.log(
          "❌ Thinker Symbol Speed: Failed to find location in CLI file"
        );
      }

      const mirrorResult = writeThinkerSymbolMirrorOption(
        content,
        savedThinkingStyle.reverseMirror
      );
      if (mirrorResult) {
        content = mirrorResult;
      } else {
        console.log(
          "❌ Thinker Symbol Mirror Option: Failed to find location in CLI file"
        );
      }
      changesMade = true;
    }

    if (changesMade) {
      writeFileSync(cliPath, content);
      setChangesApplied(true);
      setChangesAppliedState(true);
      setUpdateNotification("All settings applied to Claude Code CLI!");
      setTimeout(() => setUpdateNotification(null), 3000);
    } else {
      setUpdateNotification("No saved settings found to apply.");
      setTimeout(() => setUpdateNotification(null), 3000);
    }
  };

  const handleOpenCliJs = () => {
    try {
      // Always find the original Claude Code installation
      const paths = findClijs();
      if (!paths) {
        setUpdateNotification("Claude Code installation not found.");
        setTimeout(() => setUpdateNotification(null), 3000);
        return;
      }
      const cliPathToOpen = paths.cliPath;

      // Verify the file exists
      if (!existsSync(cliPathToOpen)) {
        setUpdateNotification("CLI file not found at expected location.");
        setTimeout(() => setUpdateNotification(null), 3000);
        return;
      }

      if (process.platform === "win32") {
        spawn("explorer", ["/select,", cliPathToOpen], {
          detached: true,
          stdio: "ignore",
        }).unref();
      } else if (process.platform === "darwin") {
        spawn("open", ["-R", cliPathToOpen], {
          detached: true,
          stdio: "ignore",
        }).unref();
      } else {
        const cliDir = dirname(cliPathToOpen);
        spawn("xdg-open", [cliDir], {
          detached: true,
          stdio: "ignore",
        }).unref();
      }

      setUpdateNotification("Opening file browser with cli.js selected...");
      setTimeout(() => setUpdateNotification(null), 2000);
    } catch (error) {
      setUpdateNotification(
        `Failed to open cli.js: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setTimeout(() => setUpdateNotification(null), 3000);
    }
  };

  const handleMainSelect = (index: number) => {
    setState((prev) => ({ ...prev, selectedMainIndex: index }));
  };

  const handleMainSubmit = (item: string) => {
    switch (item) {
      case "Themes":
        setState((prev) => ({ ...prev, currentView: "themes" }));
        break;
      case "Launch text":
        setState((prev) => ({ ...prev, currentView: "launchText" }));
        break;
      case "Thinking verbs":
        setState((prev) => ({ ...prev, currentView: "thinkingVerbs" }));
        break;
      case "Thinking style":
        setState((prev) => ({ ...prev, currentView: "thinkingStyle" }));
        break;
      case "Apply changes to cli.js":
        handleApplyChanges();
        break;
      case "Restore original Claude Code (preserves tweakcc.json)":
        handleRestoreOriginalClaude();
        break;
      case "Open tweakcc.json":
        handleOpenTweakccConfig();
        break;
      case "Open Claude Code's cli.js":
        handleOpenCliJs();
        break;
      case "Exit":
        console.log("Goodbye!");
        process.exit(0);
        break;
    }
  };

  const handleThemeSelect = (index: number) => {
    setState((prev) => ({ ...prev, selectedThemeIndex: index }));
  };

  const handleThemeSubmit = (item: string) => {
    // Extract theme ID from the item string (e.g., "Dark mode (dark)" -> "dark")
    const match = item.match(/\(([^)]+)\)$/);
    const themeId = match ? match[1] : "dark";
    const theme =
      currentThemes.find((t) => t.id === themeId) || currentThemes[0];

    setState((prev) => ({
      ...prev,
      currentView: "themeEdit",
      editingTheme: theme,
    }));
  };

  const handleBack = () => {
    if (state.currentView === "themeEdit") {
      setState((prev) => ({
        ...prev,
        currentView: "themes",
        editingTheme: undefined,
      }));
    } else if (state.currentView === "launchText") {
      setState((prev) => ({ ...prev, currentView: "main" }));
    } else if (state.currentView === "thinkingVerbs") {
      setState((prev) => ({ ...prev, currentView: "main" }));
    } else if (state.currentView === "thinkingStyle") {
      setState((prev) => ({ ...prev, currentView: "main" }));
    } else {
      setState((prev) => ({ ...prev, currentView: "main" }));
    }
  };

  const handleThemeSave = (updatedTheme: Theme) => {
    // Update the theme in the themes array
    setCurrentThemes((prev) =>
      prev.map((theme) => (theme.id === updatedTheme.id ? updatedTheme : theme))
    );

    // Update the editing theme in state so the preview updates immediately
    setState((prev) => ({ ...prev, editingTheme: updatedTheme }));

    // Save to config
    const updatedThemes = currentThemes.map((theme) =>
      theme.id === updatedTheme.id ? updatedTheme : theme
    );
    saveThemesToConfig(updatedThemes);

    // Mark changes as unapplied
    markChangesUnapplied();
  };

  const handleColorEditStart = () => {
    setState((prev) => ({ ...prev, editingColor: true }));
  };

  const handleColorEditEnd = () => {
    setState((prev) => ({ ...prev, editingColor: false }));
  };

  const handleLaunchTextSave = (config: LaunchTextConfig) => {
    setState((prev) => ({ ...prev, launchTextConfig: config }));

    // Save to config
    saveLaunchTextToConfig(config);

    // Mark changes as unapplied
    markChangesUnapplied();
  };

  const handleThinkingVerbsSave = (config: ThinkingVerbsConfig) => {
    setState((prev) => ({ ...prev, thinkingVerbsConfig: config }));

    // Save to config
    saveThinkingVerbsToConfig(config);

    // Mark changes as unapplied
    markChangesUnapplied();
  };

  const handleThinkingStyleSave = (config: ThinkingStyleConfig) => {
    setState((prev) => ({ ...prev, thinkingStyleConfig: config }));

    // Save to config
    saveThinkingStyleToConfig(config);

    // Mark changes as unapplied
    markChangesUnapplied();
  };

  const handleCreateTheme = () => {
    // Create a new theme based on the first theme as a template, or use default dark theme
    const baseTheme = currentThemes[0] || themes[0]; // Fallback to built-in dark theme
    const newTheme: Theme = {
      ...baseTheme,
      name: "New Custom Theme",
      id: `custom-${Date.now()}`, // Generate unique ID
    };

    const updatedThemes = [...currentThemes, newTheme];
    setCurrentThemes(updatedThemes);
    saveThemesToConfig(updatedThemes);

    // Navigate to edit the new theme immediately
    setState((prev) => ({
      ...prev,
      currentView: "themeEdit",
      editingTheme: newTheme,
      selectedThemeIndex: currentThemes.length, // Will be the index of the new theme
    }));
  };

  const handleDeleteTheme = (themeId: string) => {
    const updatedThemes = currentThemes.filter((theme) => theme.id !== themeId);
    setCurrentThemes(updatedThemes);
    saveThemesToConfig(updatedThemes);

    // Reset selection if needed
    setState((prev) => ({
      ...prev,
      selectedThemeIndex: Math.min(
        prev.selectedThemeIndex,
        currentThemes.length - 2
      ),
    }));
  };

  // Show startup error if there is one
  if (startupError) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text color="red">Startup Error:</Text>
        </Box>
        <Text>{startupError}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {updateNotification && (
        <Box marginBottom={1} padding={1} borderStyle="round">
          <Text color="cyan">{updateNotification}</Text>
        </Box>
      )}
      {state.currentView === "main" ? (
        <MainView
          selectedIndex={state.selectedMainIndex}
          onSelect={handleMainSelect}
          onSubmit={handleMainSubmit}
          changesApplied={changesApplied}
        />
      ) : state.currentView === "themes" ? (
        <ThemesView
          selectedIndex={state.selectedThemeIndex}
          onSelect={handleThemeSelect}
          onSubmit={handleThemeSubmit}
          onBack={handleBack}
          themes={currentThemes}
          onCreateTheme={handleCreateTheme}
          onDeleteTheme={handleDeleteTheme}
        />
      ) : state.currentView === "launchText" ? (
        <LaunchTextView
          onBack={handleBack}
          onSave={handleLaunchTextSave}
          initialConfig={state.launchTextConfig}
        />
      ) : state.currentView === "thinkingVerbs" ? (
        <ThinkingVerbsView
          onBack={handleBack}
          onSave={handleThinkingVerbsSave}
          initialConfig={state.thinkingVerbsConfig}
        />
      ) : state.currentView === "thinkingStyle" ? (
        <ThinkingStyleView
          onBack={handleBack}
          onSave={handleThinkingStyleSave}
          initialConfig={state.thinkingStyleConfig}
        />
      ) : (
        <ThemeEditView
          theme={state.editingTheme!}
          onBack={handleBack}
          onSave={handleThemeSave}
          onColorEditStart={handleColorEditStart}
          onColorEditEnd={handleColorEditEnd}
        />
      )}
    </Box>
  );
}
