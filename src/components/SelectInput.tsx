import React from 'react';
import { Box, Text, useInput } from 'ink';

interface SelectInputProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onSubmit: (item: string) => void;
}

export function SelectInput({
  items,
  selectedIndex,
  onSelect,
  onSubmit,
}: SelectInputProps) {
  useInput((input, key) => {
    if (key.upArrow) {
      onSelect(selectedIndex > 0 ? selectedIndex - 1 : items.length - 1);
    } else if (key.downArrow) {
      onSelect(selectedIndex < items.length - 1 ? selectedIndex + 1 : 0);
    } else if (key.return) {
      onSubmit(items[selectedIndex]);
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={index}>
          <Text color={index === selectedIndex ? 'cyan' : 'white'}>
            {index === selectedIndex ? '❯ ' : '  '}
            {item}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
