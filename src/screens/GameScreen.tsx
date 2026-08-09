import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Board } from '../components/Board';
import { PlayerSearchSheet } from '../components/PlayerSearchSheet';
import { Scoreboard } from '../components/Scoreboard';
import { chooseAiMove } from '../engine/ai';
import { cellCriteria, cellSolutions, newGame, pass, play } from '../engine/game';
import { normalize } from '../engine/normalize';
import type { GameConfig, GameState } from '../engine/types';
import { font, radius, useTheme } from '../theme';
import { Lang, t } from '../i18n';
import { buildShareText, dailyNumber } from '../social/daily';
import { recordResult } from '../social/stats';

interface Props {
  config: GameConfig;
  daily?: boolean;
  challengeCode?: string;
  lang: Lang;
  onExit: () => void;
}

const AI_MARK = 'O';

export function GameScreen({ config, daily, challengeCode, lang, onExit }: Props) {
  const c = useTheme();
  const stateRef = useRef<GameState>(newGame(config));
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(config.turnSeconds);
  const aiMoveCounter = useRef(0);
  const recorded = useRef(false);
  const timerAnim = useRef(new Animated.Value(1)).current;

  const state = stateRef.current;
  const isAiTurn = config.mode === 'ai' && state.turn === AI_MARK && !state.winner;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // Tur sayacı + eriyen çubuk.
  useEffect(() => {
    if (state.winner) return;
    setSecondsLeft(config.turnSeconds);
    timerAnim.setValue(1);
    const anim = Animated.timing(timerAnim, {
      toValue: 0,
      duration: config.turnSeconds * 1000,
      useNativeDriver: false,
    });
    anim.start();
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          pass(stateRef.current);
          bump();
          return config.turnSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      anim.stop();
      clearInterval(interval);
    };
  }, [state.turn, state.winner, config.turnSeconds, bump, timerAnim]);

  // Bot hamlesi.
  useEffect(() => {
    if (!isAiTurn) return;
    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (current.winner || current.turn !== AI_MARK) return;
      const move = chooseAiMove(current, config.seed + ++aiMoveCounter.current * 7919);
      if (move.kind === 'answer' && move.index !== undefined && move.player) {
        play(current, move.index, move.player.name);
      } else {
        pass(current);
      }
      bump();
    }, 1100);
    return () => clearTimeout(timer);
  }, [isAiTurn, state.turn, config.seed, bump]);

  // Maç bitince istatistiğe işle (yalnızca bota karşı modlar).
  useEffect(() => {
    if (!state.winner || recorded.current || config.mode !== 'ai') return;
    recorded.current = true;
    const result = state.winner === 'draw' ? 'draw' : state.winner === 'X' ? 'win' : 'loss';
    recordResult(result, !!daily).catch(() => {});
  }, [state.winner, config.mode, daily]);

  const onCellPress = (index: number) => {
    if (state.winner || isAiTurn) return;
    const cell = state.cells[index];
    if (cell.owner === state.turn) return;
    if (cell.owner !== null && state.stealsLeft[state.turn] <= 0) return;
    setSelectedCell(index);
  };

  const onSubmit = (name: string) => {
    if (selectedCell === null) return;
    const result = play(state, selectedCell, name);
    setSelectedCell(null);
    if (!result.ok) {
      if (result.reason === 'already-used') showToast(t('used', lang));
      else if (result.reason === 'no-match') showToast(t('wrong', lang));
    }
    bump();
  };

  const share = () => {
    Share.share({
      message: buildShareText(state, {
        daily: !!daily,
        dailyNo: dailyNumber(),
        code: challengeCode,
        lang,
      }),
    }).catch(() => {});
  };

  const criteria = selectedCell !== null ? cellCriteria(state, selectedCell) : null;
  const hintCount =
    selectedCell !== null
      ? cellSolutions(state, selectedCell).filter((p) => !state.usedNames.has(normalize(p.name)))
          .length
      : 0;

  const labelX = config.mode === 'ai' ? t('you', lang) : t('player1', lang);
  const labelO = config.mode === 'ai' ? t('bot', lang) : t('player2', lang);
  const navTitle = daily
    ? `${t('dailyGrid', lang)} #${dailyNumber()}`
    : challengeCode
      ? `${t('code', lang)}: ${challengeCode}`
      : '';

  const resultText = () => {
    if (state.winner === 'draw') return t('draw', lang);
    if (config.mode === 'ai') {
      return state.winner === 'X' ? t('youWin', lang) : t('youLose', lang);
    }
    return state.winner === 'X' ? t('xWins', lang) : t('oWins', lang);
  };

  const capturedX = state.cells.filter((cell) => cell.owner === 'X').length;
  const capturedO = state.cells.filter((cell) => cell.owner === 'O').length;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* iOS gezinme çubuğu */}
      <View style={styles.navBar}>
        <Pressable onPress={onExit} hitSlop={12} style={styles.navBack}>
          <Text style={[styles.navBackChevron, { color: c.tint }]}>‹</Text>
          <Text style={[styles.navBackText, { color: c.tint }]}>{t('home', lang)}</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: c.label }]} numberOfLines={1}>
          {navTitle}
        </Text>
        <Text
          style={[
            styles.navTimer,
            { color: secondsLeft <= 5 ? c.red : c.secondaryLabel },
          ]}
        >{`${secondsLeft}${t('seconds', lang)}`}</Text>
      </View>

      <View style={[styles.timerTrack, { backgroundColor: c.fill }]}>
        <Animated.View
          style={[
            styles.timerFill,
            {
              backgroundColor: secondsLeft <= 5 ? c.red : c.tint,
              width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>

      <View style={{ marginVertical: 14, paddingHorizontal: 16 }}>
        <Scoreboard state={state} labelX={labelX} labelO={labelO} />
      </View>

      <Board state={state} onCellPress={onCellPress} disabled={!!state.winner || isAiTurn} />

      {isAiTurn && (
        <Text style={[styles.aiThinking, { color: c.secondaryLabel }]}>{t('aiTurn', lang)}</Text>
      )}

      {toast && (
        <View style={[styles.toast, { backgroundColor: c.red }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <Modal visible={!!state.winner} transparent animationType="fade">
        <View style={styles.resultBackdrop}>
          <View style={[styles.resultCard, { backgroundColor: c.card }]}>
            <Text style={styles.resultEmoji}>
              {state.winner === 'draw' ? '🤝' : state.winner === 'X' ? '🏆' : '🥈'}
            </Text>
            <Text style={[styles.resultText, { color: c.label }]}>{resultText()}</Text>
            <Text style={[styles.resultScore, { color: c.secondaryLabel }]}>
              {labelX} {capturedX} — {capturedO} {labelO}
            </Text>
            <View style={styles.resultButtons}>
              <Pressable style={[styles.primaryBtn, { backgroundColor: c.tint }]} onPress={share}>
                <Text style={styles.primaryBtnText}>{t('share', lang)}</Text>
              </Pressable>
              {!daily && (
                <Pressable
                  style={[styles.secondaryBtn, { backgroundColor: c.fill }]}
                  onPress={() => {
                    stateRef.current = newGame({ ...config, seed: config.seed + 1 });
                    aiMoveCounter.current = 0;
                    recorded.current = false;
                    bump();
                  }}
                >
                  <Text style={[styles.secondaryBtnText, { color: c.tint }]}>
                    {t('rematch', lang)}
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.secondaryBtn, { backgroundColor: c.fill }]}
                onPress={onExit}
              >
                <Text style={[styles.secondaryBtnText, { color: c.tint }]}>{t('home', lang)}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <PlayerSearchSheet
        visible={selectedCell !== null}
        row={criteria?.row ?? null}
        col={criteria?.col ?? null}
        hintCount={hintCount}
        lang={lang}
        onSubmit={onSubmit}
        onClose={() => setSelectedCell(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  navBack: { flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 90 },
  navBackChevron: { fontSize: 26, fontWeight: '500', marginTop: -3 },
  navBackText: { fontSize: font.body },
  navTitle: { flex: 1, textAlign: 'center', fontSize: font.body, fontWeight: '600' },
  navTimer: { minWidth: 90, textAlign: 'right', fontSize: font.body, fontWeight: '600' },
  timerTrack: { height: 3, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 2 },
  aiThinking: { textAlign: 'center', marginTop: 16, fontSize: font.sub },
  toast: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  toastText: { color: '#fff', fontWeight: '600' },
  resultBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  resultCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  resultEmoji: { fontSize: 52 },
  resultText: { fontSize: font.h2, fontWeight: '700' },
  resultScore: { fontSize: font.sub },
  resultButtons: { alignSelf: 'stretch', gap: 8, marginTop: 12 },
  primaryBtn: { borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: font.body },
  secondaryBtn: { borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  secondaryBtnText: { fontWeight: '600', fontSize: font.body },
});
