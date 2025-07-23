import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ThinkingVerbsConfig } from '../types.js';
import { getCurrentClaudeTheme } from '../utils/claudeTheme.js';
import { themes } from '../themes.js';

interface ThinkingVerbsViewProps {
  onBack: () => void;
  onSave: (config: ThinkingVerbsConfig) => void;
  initialConfig?: ThinkingVerbsConfig;
}

const DEFAULT_VERBS = [
  'Pondering',
  'Investigating',
  'Inquiring',
  'Thinking',
  'Reflecting',
  'Contemplating',
  'Meditating',
];

export function ThinkingVerbsView({
  onBack,
  onSave,
  initialConfig,
}: ThinkingVerbsViewProps) {
  const [config, setConfig] = useState<ThinkingVerbsConfig>(
    initialConfig || {
      useHaikuGenerated: true,
      punctuation: '…',
      verbs: [...DEFAULT_VERBS],
    }
  );

  const options = config.useHaikuGenerated
    ? (['useHaikuGenerated'] as const)
    : (['useHaikuGenerated', 'punctuation', 'verbs'] as const);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const selectedOption = options[selectedOptionIndex];
  const [selectedVerbIndex, setSelectedVerbIndex] = useState(0);
  const [editingVerb, setEditingVerb] = useState(false);
  const [verbInput, setVerbInput] = useState('');
  const [addingNewVerb, setAddingNewVerb] = useState(false);
  const [editingPunctuation, setEditingPunctuation] = useState(false);
  const [punctuationInput, setPunctuationInput] = useState(config.punctuation);
  // Get current Claude theme and color
  const currentThemeId = getCurrentClaudeTheme();
  const currentTheme =
    themes.find(t => t.id === currentThemeId) ||
    themes.find(t => t.id === 'dark');
  const claudeColor = currentTheme?.colors.claude || 'rgb(215,119,87)';

  useInput((input, key) => {
    if (editingPunctuation) {
      if (key.return) {
        const newConfig = { ...config, punctuation: punctuationInput };
        setConfig(newConfig);
        onSave(newConfig);
        setEditingPunctuation(false);
      } else if (key.escape) {
        setPunctuationInput(config.punctuation);
        setEditingPunctuation(false);
      } else if (key.backspace || key.delete) {
        setPunctuationInput(prev => prev.slice(0, -1));
      } else if (input) {
        setPunctuationInput(prev => prev + input);
      }
      return;
    }

    if (editingVerb || addingNewVerb) {
      if (key.return) {
        if (verbInput.trim()) {
          let newConfig;
          if (addingNewVerb) {
            newConfig = {
              ...config,
              verbs: [...config.verbs, verbInput.trim()],
            };
            setConfig(newConfig);
            onSave(newConfig);
            setAddingNewVerb(false);
          } else {
            newConfig = {
              ...config,
              verbs: config.verbs.map((verb, index) =>
                index === selectedVerbIndex ? verbInput.trim() : verb
              ),
            };
            setConfig(newConfig);
            onSave(newConfig);
            setEditingVerb(false);
          }
        }
        setVerbInput('');
      } else if (key.escape) {
        setVerbInput('');
        setEditingVerb(false);
        setAddingNewVerb(false);
      } else if (key.backspace || key.delete) {
        setVerbInput(prev => prev.slice(0, -1));
      } else if (input) {
        setVerbInput(prev => prev + input);
      }
      return;
    }

    if (key.escape) {
      onBack();
    } else if (key.return) {
      if (selectedOption === 'punctuation') {
        setPunctuationInput(config.punctuation);
        setEditingPunctuation(true);
      }
    } else if (key.tab) {
      if (key.shift) {
        // Shift+Tab: go backwards
        setSelectedOptionIndex(prev =>
          prev === 0 ? options.length - 1 : prev - 1
        );
      } else {
        // Tab: go forwards
        setSelectedOptionIndex(prev =>
          prev === options.length - 1 ? 0 : prev + 1
        );
      }
    } else if (key.upArrow) {
      if (
        selectedOption === 'verbs' &&
        !config.useHaikuGenerated &&
        config.verbs.length > 0
      ) {
        setSelectedVerbIndex(prev =>
          prev > 0 ? prev - 1 : config.verbs.length - 1
        );
      }
    } else if (key.downArrow) {
      if (
        selectedOption === 'verbs' &&
        !config.useHaikuGenerated &&
        config.verbs.length > 0
      ) {
        setSelectedVerbIndex(prev =>
          prev < config.verbs.length - 1 ? prev + 1 : 0
        );
      }
    } else if (input === ' ') {
      if (selectedOption === 'useHaikuGenerated') {
        const newConfig = {
          ...config,
          useHaikuGenerated: !config.useHaikuGenerated,
        };
        setConfig(newConfig);
        onSave(newConfig);
        setSelectedOptionIndex(0); // Reset to first option when toggling
      }
    } else if (
      input === 'e' &&
      selectedOption === 'verbs' &&
      !config.useHaikuGenerated
    ) {
      // Edit verb
      if (config.verbs.length > 0) {
        setVerbInput(config.verbs[selectedVerbIndex]);
        setEditingVerb(true);
      }
    } else if (
      input === 'd' &&
      selectedOption === 'verbs' &&
      !config.useHaikuGenerated
    ) {
      // Delete verb
      if (config.verbs.length > 1) {
        const newConfig = {
          ...config,
          verbs: config.verbs.filter((_, index) => index !== selectedVerbIndex),
        };
        setConfig(newConfig);
        onSave(newConfig);
        if (selectedVerbIndex >= config.verbs.length - 1) {
          setSelectedVerbIndex(Math.max(0, config.verbs.length - 2));
        }
      }
    } else if (
      input === 'n' &&
      selectedOption === 'verbs' &&
      !config.useHaikuGenerated
    ) {
      // Add new verb
      setAddingNewVerb(true);
      setVerbInput('');
    } else if (
      key.ctrl &&
      input === 'r' &&
      selectedOption === 'verbs' &&
      !config.useHaikuGenerated
    ) {
      // Reset to default
      const newConfig = { ...config, verbs: [...DEFAULT_VERBS] };
      setConfig(newConfig);
      onSave(newConfig);
      setSelectedVerbIndex(0);
    }
  });

  const checkboxChar = config.useHaikuGenerated ? 'x' : ' ';
  const previewWidth = config.useHaikuGenerated ? 0 : 50;

  return (
    <Box>
      <Box
        flexDirection="column"
        width={config.useHaikuGenerated ? '100%' : `${100 - previewWidth}%`}
      >
        <Box marginBottom={1} flexDirection="column">
          <Text bold backgroundColor="#ffd500" color="black">
            {' '}
            Thinking verbs{' '}
          </Text>
          <Box>
            <Text dimColor>
              {selectedOption === 'punctuation'
                ? 'enter to edit punctuation'
                : 'changes auto-saved'}
            </Text>
          </Box>
          <Box>
            <Text dimColor>esc to go back</Text>
          </Box>
        </Box>

        <Box>
          <Text>
            <Text
              color={
                selectedOption === 'useHaikuGenerated' ? 'yellow' : undefined
              }
            >
              {selectedOption === 'useHaikuGenerated' ? '❯ ' : '  '}
            </Text>
            <Text
              bold
              color={
                selectedOption === 'useHaikuGenerated' ? 'yellow' : undefined
              }
            >
              Use Haiku-generated verbs
            </Text>
          </Text>
        </Box>

        {selectedOption === 'useHaikuGenerated' && (
          <Text dimColor>{'  '}space to toggle</Text>
        )}

        <Box marginLeft={2} marginBottom={1}>
          <Text>
            [{checkboxChar}] {config.useHaikuGenerated ? 'Enabled' : 'Disabled'}
          </Text>
        </Box>

        {config.useHaikuGenerated ? (
          <Box marginLeft={2} marginBottom={1}>
            <Text dimColor>
              Claude Code will automatically generate verbs using Claude 3.5
              Haiku based on your session.
            </Text>
          </Box>
        ) : (
          <>
            <Box marginLeft={2} marginBottom={1}>
              <Text dimColor>
                A hard-coded selection of verbs will be used, defined below.
              </Text>
            </Box>

            <Box flexDirection="column">
              <Text>
                <Text
                  color={
                    selectedOption === 'punctuation' ? 'yellow' : undefined
                  }
                >
                  {selectedOption === 'punctuation' ? '❯ ' : '  '}
                </Text>
                <Text
                  bold
                  color={
                    selectedOption === 'punctuation' ? 'yellow' : undefined
                  }
                >
                  Punctuation
                </Text>
              </Text>
              {selectedOption === 'punctuation' &&
                (editingPunctuation ? (
                  <Text dimColor>{'  '}enter to save</Text>
                ) : (
                  <Text dimColor>{'  '}enter to edit</Text>
                ))}
            </Box>

            <Box marginLeft={2} marginBottom={1}>
              <Box
                borderStyle="round"
                borderColor={editingPunctuation ? 'yellow' : 'gray'}
              >
                <Text>
                  {editingPunctuation ? punctuationInput : config.punctuation}
                </Text>
              </Box>
            </Box>

            <Box>
              <Text>
                <Text color={selectedOption === 'verbs' ? 'yellow' : undefined}>
                  {selectedOption === 'verbs' ? '❯ ' : '  '}
                </Text>
                <Text
                  bold
                  color={selectedOption === 'verbs' ? 'yellow' : undefined}
                >
                  Verbs
                </Text>
              </Text>
            </Box>

            {selectedOption === 'verbs' && (
              <Box flexDirection="column">
                <Text dimColor>
                  {'  '}e to edit · d to delete · n to add new · ctrl+r to reset
                </Text>
              </Box>
            )}

            <Box marginLeft={2} marginBottom={1}>
              <Box flexDirection="column">
                {(() => {
                  const maxVisible = 8; // Show 8 verbs at a time
                  const startIndex = Math.max(
                    0,
                    selectedVerbIndex - Math.floor(maxVisible / 2)
                  );
                  const endIndex = Math.min(
                    config.verbs.length,
                    startIndex + maxVisible
                  );
                  const adjustedStartIndex = Math.max(0, endIndex - maxVisible);

                  const visibleVerbs = config.verbs.slice(
                    adjustedStartIndex,
                    endIndex
                  );

                  return (
                    <>
                      {adjustedStartIndex > 0 && (
                        <Text color="gray" dimColor>
                          {' '}
                          ↑ {adjustedStartIndex} more above
                        </Text>
                      )}
                      {visibleVerbs.map((verb, visibleIndex) => {
                        const actualIndex = adjustedStartIndex + visibleIndex;
                        return (
                          <Text
                            key={actualIndex}
                            color={
                              selectedOption === 'verbs' &&
                              actualIndex === selectedVerbIndex
                                ? 'cyan'
                                : undefined
                            }
                          >
                            {selectedOption === 'verbs' &&
                            actualIndex === selectedVerbIndex
                              ? '❯ '
                              : '  '}
                            {verb}
                          </Text>
                        );
                      })}
                      {endIndex < config.verbs.length && (
                        <Text color="gray" dimColor>
                          {' '}
                          ↓ {config.verbs.length - endIndex} more below
                        </Text>
                      )}
                    </>
                  );
                })()}
                {addingNewVerb && (
                  <Box alignItems="center">
                    <Text color="yellow">❯ </Text>
                    <Box borderStyle="round" borderColor="yellow">
                      <Text>{verbInput}</Text>
                    </Box>
                  </Box>
                )}
                {editingVerb && (
                  <Box marginTop={1} alignItems="center">
                    <Text>Editing: </Text>
                    <Box borderStyle="round" borderColor="yellow">
                      <Text>{verbInput}</Text>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}
      </Box>

      {!config.useHaikuGenerated && (
        <Box width={`${previewWidth}%`} flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Preview</Text>
          </Box>
          <Box
            borderStyle="single"
            borderColor="gray"
            padding={1}
            flexDirection="column"
          >
            <Text>
              <Text color={claudeColor}>
                ✻ {config.verbs[selectedVerbIndex]}
                {config.punctuation}{' '}
              </Text>
              <Text color={currentTheme?.colors.secondaryText}>
                (10s · ↑ 456 tokens · esc to interrupt)
              </Text>
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
