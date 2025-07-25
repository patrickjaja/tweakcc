import React from 'react';
import { Text } from 'ink';
import { Theme } from '../utils/types.js';

interface ColoredColorNameProps {
  colorKey: keyof Theme['colors'];
  theme: Theme;
  bold?: boolean;
}

export function ColoredColorName({
  colorKey,
  theme,
  bold = false,
}: ColoredColorNameProps) {
  const colorValue = theme.colors[colorKey];

  // Special case: inverseText gets permission background
  if (colorKey === 'inverseText') {
    return (
      <Text
        color={colorValue}
        backgroundColor={theme.colors.permission}
        bold={bold}
      >
        {colorKey}
      </Text>
    );
  }

  // Special case: diff* colors get their own color as background, unstyled text
  if (colorKey.startsWith('diff')) {
    return (
      <Text backgroundColor={colorValue} bold={bold} color={theme.colors.text}>
        {colorKey}
      </Text>
    );
  }

  // Normal case: just the color
  return (
    <Text color={colorValue} bold={bold}>
      {colorKey}
    </Text>
  );
}
