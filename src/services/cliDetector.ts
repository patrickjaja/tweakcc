import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ClaudeCodePaths {
  cliPath: string;
  packageJsonPath: string;
  version: string;
}

const SEARCH_PATHS = [
  // Volta installation
  path.join(os.homedir(), 'AppData', 'Local', 'Volta', 'tools', 'image', 'packages', '@anthropic-ai', 'claude-code', 'node_modules', '@anthropic-ai', 'claude-code'),
  // NPM global installations
  path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', '@anthropic-ai', 'claude-code'),
  // Yarn global
  path.join(os.homedir(), 'AppData', 'Local', 'Yarn', 'config', 'global', 'node_modules', '@anthropic-ai', 'claude-code'),
  // PNPM global
  path.join(os.homedir(), 'AppData', 'Local', 'pnpm', 'global', '5', 'node_modules', '@anthropic-ai', 'claude-code'),
];

export function findClijs(): ClaudeCodePaths | null {
  process.stdout.write('Searching for Claude Code\'s cli.js\r');
  for (const searchPath of SEARCH_PATHS) {
    try {
      const cliPath = path.join(searchPath, 'cli.js');
      const packageJsonPath = path.join(searchPath, 'package.json');
      if (fs.existsSync(cliPath) && fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return {
          cliPath: cliPath,
          packageJsonPath,
          version: packageJson.version
        };
      }
    } catch (error) {
      // Continue searching if this path fails
      continue;
    }
  }
  
  return null;
}

export function getRealCcVersion(): string | null {
  const paths = findClijs();
  return paths?.version || null;
}

export function getSearchedLocations(): string {
  return SEARCH_PATHS.map(p => `- ${p}`).join('\n');
}

export function validateCliJsExists(cliPath: string): boolean {
  try {
    return fs.existsSync(cliPath) && fs.statSync(cliPath).isFile();
  } catch {
    return false;
  }
}