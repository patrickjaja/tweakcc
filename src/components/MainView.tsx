import { Box, Text } from 'ink';
import { SelectInput } from './SelectInput.js';
import { MainMenuItem } from '../types.js';

interface MainViewProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onSubmit: (item: MainMenuItem) => void;
  changesApplied: boolean;
}

const baseMenuItems = [
  MainMenuItem.THEMES,
  MainMenuItem.LAUNCH_TEXT,
  MainMenuItem.THINKING_VERBS,
  MainMenuItem.THINKING_STYLE,
];

const systemMenuItems = [
  MainMenuItem.RESTORE_ORIGINAL,
  MainMenuItem.OPEN_CONFIG,
  MainMenuItem.OPEN_CLI,
  MainMenuItem.EXIT,
];

export function MainView({
  selectedIndex,
  onSelect,
  onSubmit,
  changesApplied,
}: MainViewProps) {
  const menuItems = [
    ...(changesApplied ? [] : [MainMenuItem.APPLY_CHANGES]),
    ...baseMenuItems,
    ...systemMenuItems,
  ];
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold backgroundColor="#ffd500" color="black">
          {' '}
          Tweak Claude Code{' '}
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">
          <Text bold>Customize your Claude Code installation.</Text>{' '}
          <Text dimColor>Settings will be saved to a JSON file.</Text>
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">
          Note that when you update Claude Code, your customizations will be
          lost, and you&apos;ll have to use the &apos;Apply settings&apos; menu
          below to reapply them again.
        </Text>
      </Box>

      <SelectInput
        items={menuItems}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
        onSubmit={item => onSubmit(item as MainMenuItem)}
      />
    </Box>
  );
}
