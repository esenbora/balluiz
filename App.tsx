import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import type { Difficulty, GameConfig, GameMode } from './src/engine/types';
import type { Lang } from './src/i18n';

export default function App() {
  const [lang, setLang] = useState<Lang>('tr');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [config, setConfig] = useState<GameConfig | null>(null);

  const start = (mode: GameMode) => {
    setConfig({
      mode,
      difficulty,
      stealsPerPlayer: 3,
      turnSeconds: 30,
      seed: Math.floor(Math.random() * 2 ** 31),
    });
  };

  return (
    <>
      <StatusBar style="light" />
      {config ? (
        <GameScreen config={config} lang={lang} onExit={() => setConfig(null)} />
      ) : (
        <HomeScreen
          lang={lang}
          difficulty={difficulty}
          onChangeLang={setLang}
          onChangeDifficulty={setDifficulty}
          onStart={start}
        />
      )}
    </>
  );
}
