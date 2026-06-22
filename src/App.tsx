import { useState } from 'react';
import Lobby from './pages/Lobby';
import ModeSelect from './pages/ModeSelect';
import GameSession from './pages/GameSession';
import type { LearningSubjectCode } from './types/quiz';

type Screen = 'lobby' | 'mode-select' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [mode, setMode] = useState<'drag-drop' | 'matching' | 'listening' | 'handwriting' | 'mixed'>('drag-drop');
  const [subject, setSubject] = useState<LearningSubjectCode>('zhuyin');

  return (
    <>
      {screen === 'lobby' && (
        <Lobby
          onStart={(selectedSubject: LearningSubjectCode) => {
            setSubject(selectedSubject);
            setScreen('mode-select');
          }}
        />
      )}
      {screen === 'mode-select' && (
        <ModeSelect
          subject={subject}
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
          subject={subject}
          onBackToLobby={() => setScreen('lobby')}
          onBackToModeSelect={() => setScreen('mode-select')}
        />
      )}
    </>
  );
}

export default App;
