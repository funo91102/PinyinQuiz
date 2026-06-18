import { useState } from 'react';
import Lobby from './pages/Lobby';
import ModeSelect from './pages/ModeSelect';
import GameSession from './pages/GameSession';

type Screen = 'lobby' | 'mode-select' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [mode, setMode] = useState<'drag-drop' | 'matching' | 'listening' | 'handwriting'>('drag-drop');

  return (
    <>
      {screen === 'lobby' && (
        <Lobby onStart={() => setScreen('mode-select')} />
      )}
      {screen === 'mode-select' && (
        <ModeSelect
          onBack={() => setScreen('lobby')}
          onSelectMode={(selectedMode) => {
            setMode(selectedMode as any);
            setScreen('game');
          }}
        />
      )}
      {screen === 'game' && (
        <GameSession
          mode={mode}
          onBackToLobby={() => setScreen('lobby')}
          onBackToModeSelect={() => setScreen('mode-select')}
        />
      )}
    </>
  );
}

export default App;
