export interface Theme {
  name: string;
  id: string;
  colors: {
    autoAccept: string;
    bashBorder: string;
    claude: string;
    permission: string;
    planMode: string;
    secondaryBorder: string;
    text: string;
    inverseText: string;
    secondaryText: string;
    suggestion: string;
    remember: string;
    success: string;
    error: string;
    warning: string;
    diffAdded: string;
    diffRemoved: string;
    diffAddedDimmed: string;
    diffRemovedDimmed: string;
    diffAddedWord: string;
    diffRemovedWord: string;
    diffAddedWordDimmed: string;
    diffRemovedWordDimmed: string;
  };
}

export interface LaunchTextConfig {
  method: 'figlet' | 'custom';
  figletText: string;
  figletFont: string;
  customText: string;
}

export interface ThinkingVerbsConfig {
  useHaikuGenerated: boolean;
  punctuation: string;
  verbs: string[];
}

export interface ThinkingStyleConfig {
  reverseMirror: boolean;
  updateInterval: number;
  phases: string[];
}

export type ViewType =
  | 'main'
  | 'themes'
  | 'themeEdit'
  | 'launchText'
  | 'thinkingVerbs'
  | 'thinkingStyle';

export enum MainMenuItem {
  THEMES = 'Themes',
  LAUNCH_TEXT = 'Launch text',
  THINKING_VERBS = 'Thinking verbs',
  THINKING_STYLE = 'Thinking style',
  APPLY_CHANGES = 'Apply changes to cli.js',
  RESTORE_ORIGINAL = 'Restore original Claude Code (preserves tweakcc.json)',
  OPEN_CONFIG = 'Open tweakcc.json',
  OPEN_CLI = "Open Claude Code's cli.js",
  EXIT = 'Exit',
}

export interface AppState {
  currentView: ViewType;
  selectedMainIndex: number;
  selectedThemeIndex: number;
  editingTheme?: Theme;
  editingColor?: boolean;
  launchTextConfig?: LaunchTextConfig;
  thinkingVerbsConfig?: ThinkingVerbsConfig;
  thinkingStyleConfig?: ThinkingStyleConfig;
}
