import { Theme } from "../types.js";

export interface LocationResult {
  startIndex: number;
  endIndex: number;
  variableName?: string;
}

export interface ModificationEdit {
  startIndex: number;
  endIndex: number;
  newContent: string;
}

// Heuristic functions for finding elements in cli.js
export function getSigninBannerTextLocation(
  oldFile: string
): LocationResult | null {
  // Look for the exact banner text from the document
  const bannerText = ` ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
██║     ██║     ███████║██║   ██║██║  ██║█████╗
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗
██║     ██║   ██║██║  ██║██╔══╝
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝`;

  const index = oldFile.indexOf(bannerText);
  if (index !== -1) {
    return {
      startIndex: index - 1, // -1 for the opening back tick.
      endIndex: index + bannerText.length + 1, // +1 for the closing back tick.
    };
  }
  return null;
}

export function writeSigninBannerText(
  oldFile: string,
  newBannerText: string
): string {
  const location = getSigninBannerTextLocation(oldFile);
  if (!location) {
    return oldFile;
  }

  const newContent = JSON.stringify(newBannerText);
  const newFile =
    oldFile.slice(0, location.startIndex) +
    newContent +
    oldFile.slice(location.endIndex);

  showDiff(
    oldFile,
    newFile,
    newContent,
    location.startIndex,
    location.endIndex
  );
  return newFile;
}

export function getThemesLocation(oldFile: string): {
  switchStatement: LocationResult;
  objArr: LocationResult;
  obj: LocationResult;
} | null {
  // Look for switch statement pattern: switch(A){case"light":return ...;}
  const switchPattern =
    /switch\s*\(([^)]+)\)\s*\{[^}]*case\s*["']light["'][^}]+\}/s;
  const switchMatch = oldFile.match(switchPattern);

  if (!switchMatch || switchMatch.index == undefined) {
    console.log("Failed to find switchMatch");
    return null;
  }

  const objArrPat = /\[(?:\{label:"(?:Dark|Light).+?",value:".+?"\},?)+\]/;
  const objPat = /return\{(?:[\w$]+?:"(?:Dark|Light).+?",?)+\}/;
  const objArrMatch = oldFile.match(objArrPat);
  const objMatch = oldFile.match(objPat);

  if (!objArrMatch || objArrMatch.index == undefined) {
    console.log("Failed to find objArrMatch");
    return null;
  }

  if (!objMatch || objMatch.index == undefined) {
    console.log("Failed to find objMatch");
    return null;
  }

  return {
    switchStatement: {
      startIndex: switchMatch.index,
      endIndex: switchMatch.index + switchMatch[0].length,
      variableName: switchMatch[1].trim(),
    },
    objArr: {
      startIndex: objArrMatch.index,
      endIndex: objArrMatch.index + objArrMatch[0].length,
    },
    obj: {
      startIndex: objMatch.index,
      endIndex: objMatch.index + objMatch[0].length,
    },
  };
}

export function writeThemes(oldFile: string, themes: any[]): string | null {
  const locations = getThemesLocation(oldFile);
  if (!locations) {
    return null;
  }

  if (themes.length === 0) {
    return oldFile;
  }

  let newFile = oldFile;

  // Process in reverse order to avoid index shifting

  // Update theme mapping object (obj)
  const obj =
    "return" +
    JSON.stringify(
      Object.fromEntries(themes.map((theme) => [theme.id, theme.name]))
    );
  newFile =
    newFile.slice(0, locations.obj.startIndex) +
    obj +
    newFile.slice(locations.obj.endIndex);
  showDiff(
    oldFile,
    newFile,
    obj,
    locations.obj.startIndex,
    locations.obj.endIndex
  );
  oldFile = newFile;

  // Update theme options array (objArr)
  const objArr = JSON.stringify(
    themes.map((theme) => ({ label: theme.name, value: theme.id }))
  );
  newFile =
    newFile.slice(0, locations.objArr.startIndex) +
    objArr +
    newFile.slice(locations.objArr.endIndex);
  showDiff(
    oldFile,
    newFile,
    objArr,
    locations.objArr.startIndex,
    locations.objArr.endIndex
  );
  oldFile = newFile;

  // Update switch statement
  let switchStatement = `switch(${locations.switchStatement.variableName}){\n`;
  themes.forEach((theme) => {
    switchStatement += `case"${theme.id}":return${JSON.stringify(
      theme.colors
    )};\n`;
  });
  switchStatement += `default:return${JSON.stringify(themes[0].colors)};\n}`;

  newFile =
    newFile.slice(0, locations.switchStatement.startIndex) +
    switchStatement +
    newFile.slice(locations.switchStatement.endIndex);
  showDiff(
    oldFile,
    newFile,
    switchStatement,
    locations.switchStatement.startIndex,
    locations.switchStatement.endIndex
  );

  return newFile;
}

function getThinkerSymbolCharsLocation(oldFile: string) {
  const results = [];

  // Find all arrays that look like symbol arrays with the dot character
  const arrayPattern = /\["[·✢*✳✶✻✽]",\s*(?:"[·✢*✳✶✻✽]",?\s*)+\]/g;
  let match;
  while ((match = arrayPattern.exec(oldFile)) !== null) {
    results.push({
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return results;
}

export function writeThinkerSymbolChars(
  oldFile: string,
  symbols: string[]
): string | null {
  const locations = getThinkerSymbolCharsLocation(oldFile);
  if (locations.length === 0) {
    return null;
  }

  const symbolsJson = JSON.stringify(symbols);

  // Sort locations by start index in descending order to apply from end to beginning.
  const sortedLocations = locations.sort((a, b) => b.startIndex - a.startIndex);

  let newFile = oldFile;
  for (let i = 0; i < sortedLocations.length; i++) {
    const updatedFile =
      newFile.slice(0, sortedLocations[i].startIndex) +
      symbolsJson +
      newFile.slice(sortedLocations[i].endIndex);

    showDiff(
      newFile,
      updatedFile,
      symbolsJson,
      sortedLocations[i].startIndex,
      sortedLocations[i].endIndex
    );
    newFile = updatedFile;
  }

  return newFile;
}

export function getThinkerSymbolSpeedLocation(
  oldFile: string
): LocationResult | null {
  // Use the original full regex to find the exact pattern
  const speedPattern =
    /[\w$]+\(\(\)=>\{if\(![\w$]+\)\{[\w$]+\(\d+\);return\}[\w$]+\(\([^)]+\)=>[^)]+\+1\)\},(\d+)\)/;
  const match = oldFile.match(speedPattern);

  if (match && match.index !== undefined) {
    // Find where the captured number starts and ends within the full match
    const fullMatchText = match[0];
    const capturedNumber = match[1];

    // Find the number within the full match
    const numberIndex = fullMatchText.lastIndexOf(capturedNumber);
    const startIndex = match.index + numberIndex;
    const endIndex = startIndex + capturedNumber.length;

    return {
      startIndex: startIndex,
      endIndex: endIndex,
    };
  }
  return null;
}

export function writeThinkerSymbolSpeed(
  oldFile: string,
  speed: number
): string | null {
  const location = getThinkerSymbolSpeedLocation(oldFile);
  if (!location) {
    return null;
  }

  const speedStr = JSON.stringify(speed);

  const newContent =
    oldFile.slice(0, location.startIndex) +
    speedStr +
    oldFile.slice(location.endIndex);

  showDiff(
    oldFile,
    newContent,
    speedStr,
    location.startIndex,
    location.endIndex
  );
  return newContent;
}

export function getUseHaikuVerbsLocation(
  oldFile: string
): LocationResult | null {
  const envPattern = /process\.env\.DISABLE_NON_ESSENTIAL_MODEL_CALLS/;
  const match = oldFile.match(envPattern);

  if (!match || match.index == undefined) {
    return null;
  }

  return {
    startIndex: match.index,
    endIndex: match.index + match[0].length,
  };
}

export function writeUseHaikuVerbs(
  oldFile: string,
  useHaiku: boolean
): string | null {
  const location = getUseHaikuVerbsLocation(oldFile);
  if (!location) {
    return null;
  }

  const newValue = useHaiku ? '"0"' : '"1"';
  const newFile =
    oldFile.slice(0, location.startIndex) +
    newValue +
    oldFile.slice(location.endIndex);

  showDiff(oldFile, newFile, newValue, location.startIndex, location.endIndex);
  return newFile;
}

export function getThinkerVerbsLocation(
  oldFile: string
): { okayVerbs: LocationResult; badVerbs: LocationResult } | null {
  const okayPattern = /=\[\s*(?:"[A-Z][a-z]+ing",?\s*)+\]/s;
  const okayMatch = oldFile.match(okayPattern);
  if (!okayMatch || okayMatch.index == undefined) {
    return null;
  }

  const badPattern = /new Set\(\[\s*(?:"[A-Z][a-z]+ing",?\s*)+\]\)/s;
  const badMatch = oldFile.match(badPattern);
  if (!badMatch || badMatch.index == undefined) {
    return null;
  }

  return {
    okayVerbs: {
      startIndex: okayMatch.index,
      endIndex: okayMatch.index + okayMatch[0].length,
    },
    badVerbs: {
      startIndex: badMatch.index,
      endIndex: badMatch.index + badMatch[0].length,
    },
  };
}

export function writeThinkerVerbs(
  oldFile: string,
  verbs: string[]
): string | null {
  const location = getThinkerVerbsLocation(oldFile);
  if (!location) {
    return null;
  }

  const verbsJson = "=" + JSON.stringify(verbs);
  const badVerbsReplacement = "new Set([])";
  const newFile =
    oldFile.slice(0, location.okayVerbs.startIndex) +
    verbsJson +
    oldFile.slice(location.okayVerbs.endIndex, location.badVerbs.startIndex) +
    badVerbsReplacement +
    oldFile.slice(location.badVerbs.endIndex);

  showDiff(
    oldFile,
    newFile,
    verbsJson,
    location.okayVerbs.startIndex,
    location.okayVerbs.endIndex
  );
  return newFile;
}

export function getThinkerPunctuationLocation(
  oldFile: string
): LocationResult | null {
  // Look for the exact pattern from the document
  const punctPattern =
    /[\w$]+\.createElement\([\w$]+,\s*\{\s*color:\s*[\w$]+,\s*key:\s*"message"\s*\},\s*[\w$]+,\s*"…",\s*" "\s*\)/;
  const match = oldFile.match(punctPattern);

  if (!match || match.index == undefined) {
    return null;
  }

  const punctStart = match.index + match[0].indexOf(`"…"`);
  const punctEnd = punctStart + 3;
  return {
    startIndex: punctStart,
    endIndex: punctEnd,
  };
}

export function writeThinkerPunctuation(
  oldFile: string,
  punctuation: string
): string | null {
  const location = getThinkerPunctuationLocation(oldFile);
  if (!location) {
    return null;
  }

  const punctJson = JSON.stringify(punctuation);
  const newFile =
    oldFile.slice(0, location.startIndex) +
    punctJson +
    oldFile.slice(location.endIndex);

  showDiff(oldFile, newFile, punctJson, location.startIndex, location.endIndex);
  return newFile;
}

export function getThinkerSymbolMirrorOptionLocation(
  oldFile: string
): LocationResult | null {
  const mirrorPattern =
    /=\s*\[\.\.\.(\w+),\s*\.\.\.?\[\.\.\.\1\]\.reverse\(\)\]/;
  const match = oldFile.match(mirrorPattern);

  if (!match || match.index == undefined) {
    return null;
  }

  return {
    startIndex: match.index,
    endIndex: match.index + match[0].length,
    variableName: match[1],
  };
}

export function writeThinkerSymbolMirrorOption(
  oldFile: string,
  enableMirror: boolean
): string | null {
  const location = getThinkerSymbolMirrorOptionLocation(oldFile);
  if (!location) {
    return null;
  }

  const varName = location.variableName;
  const newArray = enableMirror
    ? `=[...${varName},...[...${varName}].reverse()]`
    : `=[...${varName}]`;

  const newFile =
    oldFile.slice(0, location.startIndex) +
    newArray +
    oldFile.slice(location.endIndex);

  showDiff(oldFile, newFile, newArray, location.startIndex, location.endIndex);
  return newFile;
}

// Main modification application function
function showDiff(
  oldFileContents: string,
  newFileContents: string,
  injectedText: string,
  startIndex: number,
  endIndex: number
): void {
  const contextStart = Math.max(0, startIndex - 20);
  const contextEndOld = Math.min(oldFileContents.length, endIndex + 20);
  const contextEndNew = Math.min(
    newFileContents.length,
    startIndex + injectedText.length + 20
  );

  const oldBefore = oldFileContents.slice(contextStart, startIndex);
  const oldChanged = oldFileContents.slice(startIndex, endIndex);
  const oldAfter = oldFileContents.slice(endIndex, contextEndOld);

  const newBefore = newFileContents.slice(contextStart, startIndex);
  const newChanged = newFileContents.slice(
    startIndex,
    startIndex + injectedText.length
  );
  const newAfter = newFileContents.slice(
    startIndex + injectedText.length,
    contextEndNew
  );

  console.log("\n--- Diff ---");
  console.log("OLD:", oldBefore + `\x1b[31m${oldChanged}\x1b[0m` + oldAfter);
  console.log("NEW:", newBefore + `\x1b[32m${newChanged}\x1b[0m` + newAfter);
  console.log("--- End Diff ---\n");
}
