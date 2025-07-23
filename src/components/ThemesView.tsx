import React from 'react';
import { Box, Text, useInput } from 'ink';
import { SelectInput } from './SelectInput.js';
import { ThemePreview } from './ThemePreview.js';
import { Theme } from '../types.js';

function generateThemeItems(themes: Theme[]): string[] {
  return themes.map(theme => `${theme.name} (${theme.id})`);
}

interface ThemesViewProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onSubmit: (item: string) => void;
  onBack: () => void;
  themes: Theme[];
  onCreateTheme: () => void;
  onDeleteTheme: (themeId: string) => void;
}

export function ThemesView({
  selectedIndex,
  onSelect,
  onSubmit,
  onBack,
  themes,
  onCreateTheme,
  onDeleteTheme,
}: ThemesViewProps) {
  useInput((input, key) => {
    if (key.escape) {
      onBack();
    } else if (input === 'n') {
      onCreateTheme();
    } else if (input === 'd') {
      // Get the selected theme ID for deletion
      const selectedItem = generateThemeItems(themes)[selectedIndex];
      if (selectedItem) {
        const match = selectedItem.match(/\(([^)]+)\)$/);
        const themeId = match ? match[1] : null;
        if (themeId) {
          onDeleteTheme(themeId);
        }
      }
    } else if (key.ctrl && input === 'r') {
      console.log('Resetting to default themes...');
    }
  });

  const themeItems = generateThemeItems(themes);
  const selectedTheme =
    themes.find(t => themeItems[selectedIndex]?.includes(`(${t.id})`)) ||
    themes[0];

  // If no themes exist, show a message
  if (themes.length === 0) {
    return (
      <Box>
        <Box flexDirection="column" width="100%">
          <Text bold backgroundColor="#ffd500" color="black">
            {' '}
            Themes{' '}
          </Text>
          <Box marginBottom={1} flexDirection="column">
            <Text dimColor>n to create a new theme</Text>
            <Text dimColor>esc to go back</Text>
          </Box>
          <Text>No themes available!</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box flexDirection="column" width="50%">
        <Text bold backgroundColor="#ffd500" color="black">
          {' '}
          Themes{' '}
        </Text>
        <Box marginBottom={1} flexDirection="column">
          <Text dimColor>n to create a new theme</Text>
          <Text dimColor>d to delete a theme</Text>
          <Text dimColor>ctrl+r to delete all themes and restore built-in</Text>
          <Text dimColor>esc/backspace to go back to main menus</Text>
        </Box>

        <SelectInput
          items={themeItems}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          onSubmit={onSubmit}
        />
      </Box>

      <Box width="50%">
        <ThemePreview theme={selectedTheme} />
      </Box>
    </Box>
  );
}
