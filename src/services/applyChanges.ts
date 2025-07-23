import { readFileSync, writeFileSync } from 'fs';
import figlet from 'figlet';
import {
  writeThemes,
  writeSigninBannerText,
  writeUseHaikuVerbs,
  writeThinkerVerbs,
  writeThinkerPunctuation,
  writeThinkerSymbolChars,
  writeThinkerSymbolSpeed,
  writeThinkerSymbolMirrorOption,
} from './cliModifier.js';
import { getAllConfigData, setChangesApplied } from './configManager.js';
import {
  Theme,
  LaunchTextConfig,
  ThinkingVerbsConfig,
  ThinkingStyleConfig,
} from '../types.js';

interface ApplyResult {
  success: boolean;
  changesMade: boolean;
  message: string;
}

function applyThemes(
  content: string,
  themes: Theme[]
): { content: string; success: boolean } {
  if (!themes.length) {
    return { content, success: true };
  }

  const result = writeThemes(content, themes);
  if (result) {
    console.log('✓ Themes applied successfully');
    return { content: result, success: true };
  } else {
    console.log('❌ Themes: Failed to find location in CLI file');
    return { content, success: false };
  }
}

function applyLaunchText(
  content: string,
  config: LaunchTextConfig
): { content: string; success: boolean } {
  let textToApply = '';

  if (config.method === 'custom' && config.customText) {
    textToApply = config.customText;
  } else if (config.method === 'figlet' && config.figletText) {
    try {
      textToApply = figlet.textSync(config.figletText.replace('\n', ' '), {
        font: config.figletFont as unknown as figlet.Fonts,
      });
    } catch {
      console.log('❌ Launch Text: Failed to generate figlet text');
      return { content, success: false };
    }
  }

  if (textToApply) {
    const result = writeSigninBannerText(content, textToApply);
    if (result) {
      console.log('✓ Launch text applied successfully');
      return { content: result, success: true };
    } else {
      console.log('❌ Launch Text: Failed to find location in CLI file');
      return { content, success: false };
    }
  }

  return { content, success: true };
}

function applyThinkingVerbs(
  content: string,
  config: ThinkingVerbsConfig
): { content: string; success: boolean } {
  let currentContent = content;
  let allSucceeded = true;

  const haikuResult = writeUseHaikuVerbs(
    currentContent,
    config.useHaikuGenerated
  );
  if (haikuResult) {
    currentContent = haikuResult;
    console.log('✓ Haiku verbs setting applied successfully');
  } else {
    console.log('❌ Use Haiku Verbs: Failed to find location in CLI file');
    allSucceeded = false;
  }

  const verbsResult = writeThinkerVerbs(currentContent, config.verbs);
  if (verbsResult) {
    currentContent = verbsResult;
    console.log('✓ Thinking verbs applied successfully');
  } else {
    console.log('❌ Thinker Verbs: Failed to find location in CLI file');
    allSucceeded = false;
  }

  const punctResult = writeThinkerPunctuation(
    currentContent,
    config.punctuation
  );
  if (punctResult) {
    currentContent = punctResult;
    console.log('✓ Thinking punctuation applied successfully');
  } else {
    console.log('❌ Thinker Punctuation: Failed to find location in CLI file');
    allSucceeded = false;
  }

  return { content: currentContent, success: allSucceeded };
}

function applyThinkingStyle(
  content: string,
  config: ThinkingStyleConfig
): { content: string; success: boolean } {
  let currentContent = content;
  let allSucceeded = true;

  const charsResult = writeThinkerSymbolChars(currentContent, config.phases);
  if (charsResult) {
    currentContent = charsResult;
    console.log('✓ Thinking style characters applied successfully');
  } else {
    console.log('❌ Thinker Symbol Chars: Failed to find location in CLI file');
    allSucceeded = false;
  }

  const speedResult = writeThinkerSymbolSpeed(
    currentContent,
    config.updateInterval
  );
  if (speedResult) {
    currentContent = speedResult;
    console.log('✓ Thinking style speed applied successfully');
  } else {
    console.log('❌ Thinker Symbol Speed: Failed to find location in CLI file');
    allSucceeded = false;
  }

  const mirrorResult = writeThinkerSymbolMirrorOption(
    currentContent,
    config.reverseMirror
  );
  if (mirrorResult) {
    currentContent = mirrorResult;
    console.log('✓ Thinking style mirror option applied successfully');
  } else {
    console.log(
      '❌ Thinker Symbol Mirror Option: Failed to find location in CLI file'
    );
    allSucceeded = false;
  }

  return { content: currentContent, success: allSucceeded };
}

export function applyAllChanges(cliPath: string): ApplyResult {
  if (!cliPath) {
    return {
      success: false,
      changesMade: false,
      message: 'No CLI path found. Cannot apply changes.',
    };
  }

  let content = readFileSync(cliPath, 'utf8');
  let changesMade = false;
  let allSucceeded = true;

  const configData = getAllConfigData();

  // Apply themes
  if (configData.themes && configData.themes.length > 0) {
    const result = applyThemes(content, configData.themes);
    content = result.content;
    if (result.success) {
      changesMade = true;
    } else {
      allSucceeded = false;
    }
  }

  // Apply launch text
  if (configData.launchText) {
    const result = applyLaunchText(content, configData.launchText);
    content = result.content;
    if (result.success) {
      changesMade = true;
    } else {
      allSucceeded = false;
    }
  }

  // Apply thinking verbs
  if (configData.thinkingVerbs) {
    const result = applyThinkingVerbs(content, configData.thinkingVerbs);
    content = result.content;
    if (result.success) {
      changesMade = true;
    } else {
      allSucceeded = false;
    }
  }

  // Apply thinking style
  if (configData.thinkingStyle) {
    const result = applyThinkingStyle(content, configData.thinkingStyle);
    content = result.content;
    if (result.success) {
      changesMade = true;
    } else {
      allSucceeded = false;
    }
  }

  if (changesMade) {
    try {
      writeFileSync(cliPath, content);
      setChangesApplied(true);

      const message = allSucceeded
        ? 'All changes applied successfully!'
        : 'Changes applied with some warnings. Check console for details.';

      return {
        success: true,
        changesMade: true,
        message,
      };
    } catch (error) {
      return {
        success: false,
        changesMade: false,
        message: `Failed to write changes to CLI file: ${error}`,
      };
    }
  } else {
    return {
      success: true,
      changesMade: false,
      message: 'No changes to apply.',
    };
  }
}
