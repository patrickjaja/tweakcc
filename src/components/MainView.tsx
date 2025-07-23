import React from "react";
import { Box, Text } from "ink";
import { SelectInput } from "./SelectInput.js";

interface MainViewProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  onSubmit: (item: string) => void;
  changesApplied: boolean;
}

const baseMenuItems = [
  "Themes",
  "Launch text",
  "Thinking verbs",
  "Thinking style",
];

const systemMenuItems = [
  "Restore original Claude Code (preserves tweakcc.json)",
  "Open tweakcc.json",
  "Open Claude Code's cli.js",
  "Exit",
];

export function MainView({
  selectedIndex,
  onSelect,
  onSubmit,
  changesApplied,
}: MainViewProps) {
  const menuItems = [
    ...(changesApplied ? [] : ["Apply changes to cli.js"]),
    ...baseMenuItems,
    ...systemMenuItems,
  ];
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold backgroundColor="#ffd500" color="black">
          {" "}
          Tweak Claude Code{" "}
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">
          <Text bold>Customize your Claude Code installation.</Text>{" "}
          <Text dimColor>Settings will be saved to a JSON file.</Text>
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="gray">
          Note that when you update Claude Code, your customizations will be
          lost, and you'll have to use the 'Apply settings' menu below to
          reapply them again.
        </Text>
      </Box>

      <SelectInput
        items={menuItems}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
