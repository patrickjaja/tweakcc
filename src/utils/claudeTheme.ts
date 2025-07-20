import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function getCurrentClaudeTheme(): string {
  try {
    const claudeConfigPath = path.join(os.homedir(), '.claude.json');
    if (fs.existsSync(claudeConfigPath)) {
      const configData = fs.readFileSync(claudeConfigPath, 'utf8');
      const config = JSON.parse(configData);
      return config.theme || 'dark';
    }
  } catch (error) {
    // If we can't read the config file, default to dark
  }
  return 'dark';
}