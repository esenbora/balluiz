import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import type { Difficulty, GameConfig, GameMode } from './src/engine/types';
import type { Lang } from './src/i18n';
import { dailySeed } from './src/social/daily';

interface Launch {
  config: GameConfig;
  daily?: boolean;
  challengeCode?: string;
}

export default function App() {
  const scheme = useColorScheme();
  const [lang, setLang] = useState<Lang>('tr');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const baseConfig = (mode: GameMode, seed: number): GameConfig => ({
    mode,
    difficulty,
    stealsPerPlayer: 3,
    turnSeconds: 30,
    seed,
  });

  const exit = () => {
    setLaunch(null);
    setRefreshKey((k) => k + 1); // ana ekranda istatistikleri tazele
  };

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {launch ? (
        <GameScreen
          config={launch.config}
          daily={launch.daily}
          challengeCode={launch.challengeCode}
          lang={lang}
          onExit={exit}
        />
      ) : (
        <HomeScreen
          lang={lang}
          difficulty={difficulty}
          refreshKey={refreshKey}
          onChangeLang={setLang}
          onChangeDifficulty={setDifficulty}
          onStart={(mode) =>
            setLaunch({ config: baseConfig(mode, Math.floor(Math.random() * 2 ** 31)) })
          }
          onStartDaily={() => setLaunch({ config: baseConfig('ai', dailySeed()), daily: true })}
          onStartChallenge={(seed, code) =>
            setLaunch({ config: baseConfig('ai', seed), challengeCode: code })
          }
        />
      )}
    </>
  );
}
