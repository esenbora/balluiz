import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Board } from '../components/Board';
import { PlayerSearchSheet } from '../components/PlayerSearchSheet';
import { Scoreboard } from '../components/Scoreboard';
import { chooseAiMove } from '../engine/ai';
import { cellCriteria, cellSolutions, newGame, pass, play } from '../engine/game';
import { normalize } from '../engine/normalize';
import type { GameConfig, GameState } from '../engine/types';
import { colors, font, radius } from '../theme';
import { Lang, t } from '../i18n';

interface Props {
  config: GameConfig;
  lang: Lang;
  onExit: () => void;
}

const AI_MARK = 'O';

export function GameScreen({ config, lang, onExit }: Props) {
  const stateRef = useRef<GameState>(newGame(config));
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(config.turnSeconds);
  const aiMoveCounter = useRef(0);
  const timerAnim = useRef(new Animated.Value(1)).current;

  const state = stateRef.current;
  const isAiTurn = config.mode === 'ai' && state.turn === AI_MARK && !state.winner;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // Tur sayacı: süre dolarsa pas. Üstteki çubuk turla birlikte erir.
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

  const criteria = selectedCell !== null ? cellCriteria(state, selectedCell) : null;
  const hintCount =
    selectedCell !== null
      ? cellSolutions(state, selectedCell).filter((p) => !state.usedNames.has(normalize(p.name)))
          .length
      : 0;

  const labelX = config.mode === 'ai' ? t('you', lang) : t('player1', lang);
  const labelO = config.mode === 'ai' ? t('bot', lang) : t('player2', lang);

  const resultText = () => {
    if (state.winner === 'draw') return t('draw', lang);
    if (config.mode === 'ai') {
      return state.winner === 'X' ? t('youWin', lang) : t('youLose', lang);
    }
    return state.winner === 'X' ? t('xWins', lang) : t('oWins', lang);
  };

  const capturedX = state.cells.filter((c) => c.owner === 'X').length;
  const capturedO = state.cells.filter((c) => c.owner === 'O').length;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={styles.back}>‹ {t('home', lang)}</Text>
        </Pressable>
        <Text
          style={[styles.timerText, secondsLeft <= 5 && { color: colors.danger }]}
        >{`${secondsLeft}${t('seconds', lang)}`}</Text>
      </View>

      {/* Tur süresi çubuğu */}
      <View style={styles.timerTrack}>
        <Animated.View
          style={[
            styles.timerFill,
            {
              backgroundColor: secondsLeft <= 5 ? colors.danger : colors.primary,
              width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>

      <View style={{ marginVertical: 14 }}>
        <Scoreboard state={state} labelX={labelX} labelO={labelO} />
      </View>

      <Board state={state} onCellPress={onCellPress} disabled={!!state.winner || isAiTurn} />

      {isAiTurn && <Text style={styles.aiThinking}>{t('aiTurn', lang)}</Text>}

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <Modal visible={!!state.winner} transparent animationType="fade">
        <View style={styles.resultBackdrop}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>
              {state.winner === 'draw' ? '🤝' : state.winner === 'X' ? '🏆' : '🥈'}
            </Text>
            <Text style={styles.resultText}>{resultText()}</Text>
            <Text style={styles.resultScore}>
              {t('finalScore', lang)}: {labelX} {capturedX} — {capturedO} {labelO}
            </Text>
            <View style={styles.resultButtons}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  stateRef.current = newGame({ ...config, seed: config.seed + 1 });
                  aiMoveCounter.current = 0;
                  bump();
                }}
              >
                <Text style={styles.primaryBtnText}>{t('rematch', lang)}</Text>
              </Pressable>
              <Pressable style={styles.ghostBtn} onPress={onExit}>
                <Text style={styles.ghostBtnText}>{t('home', lang)}</Text>
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
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60, paddingHorizontal: 12 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  back: { color: colors.textDim, fontSize: font.body, fontWeight: '700' },
  timerText: { color: colors.primary, fontWeight: '800', fontSize: font.h2 },
  timerTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 3 },
  aiThinking: {
    color: colors.o,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '700',
    fontSize: font.body,
  },
  toast: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  toastText: { color: '#fff', fontWeight: '700' },
  resultBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,8,16,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 26,
    alignItems: 'center',
    gap: 10,
  },
  resultEmoji: { fontSize: 54 },
  resultText: { color: colors.text, fontSize: font.h1, fontWeight: '900' },
  resultScore: { color: colors.textDim, fontSize: font.body, fontWeight: '600' },
  resultButtons: { flexDirection: 'row', gap: 12, marginTop: 10 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  primaryBtnText: { color: colors.bg, fontWeight: '800', fontSize: font.body },
  ghostBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  ghostBtnText: { color: colors.text, fontWeight: '700', fontSize: font.body },
});
