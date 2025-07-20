import React, { useState } from 'react';
import { Box, useInput } from 'ink';
import { MainView } from './components/MainView.js';
import { ThemesView } from './components/ThemesView.js';
import { ThemeEditView } from './components/ThemeEditView.js';
import { LaunchTextView } from './components/LaunchTextView.js';
import { ThinkingVerbsView } from './components/ThinkingVerbsView.js';
import { ThinkingStyleView } from './components/ThinkingStyleView.js';
import { AppState, ViewType, Theme, LaunchTextConfig, ThinkingVerbsConfig, ThinkingStyleConfig } from './types.js';
import { themes } from './themes.js';

export default function App() {
  const [state, setState] = useState<AppState>({
    currentView: 'main',
    selectedMainIndex: 0,
    selectedThemeIndex: 0
  });
  const [currentThemes, setCurrentThemes] = useState<Theme[]>(themes);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      process.exit(0);
    }
    if ((input === 'q' || key.escape || key.backspace) && !state.editingColor && state.currentView === 'main') {
      process.exit(0);
    }
  });

  const handleMainSelect = (index: number) => {
    setState(prev => ({ ...prev, selectedMainIndex: index }));
  };

  const handleMainSubmit = (item: string) => {
    switch(item) {
      case 'Themes':
        setState(prev => ({ ...prev, currentView: 'themes' }));
        break;
      case 'Launch text':
        setState(prev => ({ ...prev, currentView: 'launchText' }));
        break;
      case 'Thinking verbs':
        setState(prev => ({ ...prev, currentView: 'thinkingVerbs' }));
        break;
      case 'Thinking style':
        setState(prev => ({ ...prev, currentView: 'thinkingStyle' }));
        break;
      case 'Restore original Claude Code (preserves tweakcc.json)':
        console.log('Restoring original Claude Code...');
        process.exit(0);
        break;
      case 'Open tweakcc.json':
        console.log('Opening tweakcc.json...');
        process.exit(0);
        break;
      case 'Open Claude Code\'s cli.js':
        console.log('Opening Claude Code\'s cli.js...');
        process.exit(0);
        break;
      case 'Exit':
        console.log('Goodbye!');
        process.exit(0);
        break;
    }
  };

  const handleThemeSelect = (index: number) => {
    setState(prev => ({ ...prev, selectedThemeIndex: index }));
  };

  const handleThemeSubmit = (item: string) => {
    // Extract theme ID from the item string (e.g., "Dark mode (dark)" -> "dark")
    const match = item.match(/\(([^)]+)\)$/);
    const themeId = match ? match[1] : 'dark';
    const theme = currentThemes.find(t => t.id === themeId) || currentThemes[0];
    
    setState(prev => ({ 
      ...prev, 
      currentView: 'themeEdit',
      editingTheme: theme
    }));
  };

  const handleBack = () => {
    if (state.currentView === 'themeEdit') {
      setState(prev => ({ ...prev, currentView: 'themes', editingTheme: undefined }));
    } else if (state.currentView === 'launchText') {
      setState(prev => ({ ...prev, currentView: 'main' }));
    } else if (state.currentView === 'thinkingVerbs') {
      setState(prev => ({ ...prev, currentView: 'main' }));
    } else if (state.currentView === 'thinkingStyle') {
      setState(prev => ({ ...prev, currentView: 'main' }));
    } else {
      setState(prev => ({ ...prev, currentView: 'main' }));
    }
  };

  const handleThemeSave = (updatedTheme: Theme) => {
    // Update the theme in the themes array
    setCurrentThemes(prev => 
      prev.map(theme => 
        theme.id === updatedTheme.id ? updatedTheme : theme
      )
    );
    
    // Update the editing theme in state so the preview updates immediately
    setState(prev => ({ ...prev, editingTheme: updatedTheme }));
  };

  const handleColorEditStart = () => {
    setState(prev => ({ ...prev, editingColor: true }));
  };

  const handleColorEditEnd = () => {
    setState(prev => ({ ...prev, editingColor: false }));
  };

  const handleLaunchTextSave = (config: LaunchTextConfig) => {
    setState(prev => ({ ...prev, launchTextConfig: config }));
    console.log('Launch text saved:', config);
  };

  const handleThinkingVerbsSave = (config: ThinkingVerbsConfig) => {
    setState(prev => ({ ...prev, thinkingVerbsConfig: config }));
    console.log('Thinking verbs saved:', config);
  };

  const handleThinkingStyleSave = (config: ThinkingStyleConfig) => {
    setState(prev => ({ ...prev, thinkingStyleConfig: config }));
    console.log('Thinking style saved:', config);
  };

  const handleCreateTheme = () => {
    // Create a new theme based on the first theme as a template, or use default dark theme
    const baseTheme = currentThemes[0] || themes[0]; // Fallback to built-in dark theme
    const newTheme: Theme = {
      ...baseTheme,
      name: "New Custom Theme",
      id: `custom-${Date.now()}`, // Generate unique ID
    };
    
    setCurrentThemes(prev => [...prev, newTheme]);
    
    // Navigate to edit the new theme immediately
    setState(prev => ({ 
      ...prev, 
      currentView: 'themeEdit',
      editingTheme: newTheme,
      selectedThemeIndex: currentThemes.length // Will be the index of the new theme
    }));
  };

  const handleDeleteTheme = (themeId: string) => {
    setCurrentThemes(prev => prev.filter(theme => theme.id !== themeId));
    
    // Reset selection if needed
    setState(prev => ({
      ...prev,
      selectedThemeIndex: Math.min(prev.selectedThemeIndex, currentThemes.length - 2)
    }));
  };

  return (
    <Box flexDirection="column">
      {state.currentView === 'main' ? (
        <MainView
          selectedIndex={state.selectedMainIndex}
          onSelect={handleMainSelect}
          onSubmit={handleMainSubmit}
        />
      ) : state.currentView === 'themes' ? (
        <ThemesView
          selectedIndex={state.selectedThemeIndex}
          onSelect={handleThemeSelect}
          onSubmit={handleThemeSubmit}
          onBack={handleBack}
          themes={currentThemes}
          onCreateTheme={handleCreateTheme}
          onDeleteTheme={handleDeleteTheme}
        />
      ) : state.currentView === 'launchText' ? (
        <LaunchTextView
          onBack={handleBack}
          onSave={handleLaunchTextSave}
          initialConfig={state.launchTextConfig}
        />
      ) : state.currentView === 'thinkingVerbs' ? (
        <ThinkingVerbsView
          onBack={handleBack}
          onSave={handleThinkingVerbsSave}
          initialConfig={state.thinkingVerbsConfig}
        />
      ) : state.currentView === 'thinkingStyle' ? (
        <ThinkingStyleView
          onBack={handleBack}
          onSave={handleThinkingStyleSave}
          initialConfig={state.thinkingStyleConfig}
        />
      ) : (
        <ThemeEditView
          theme={state.editingTheme!}
          onBack={handleBack}
          onSave={handleThemeSave}
          onColorEditStart={handleColorEditStart}
          onColorEditEnd={handleColorEditEnd}
        />
      )}
    </Box>
  );
}