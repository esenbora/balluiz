import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Board } from '../components/Board';
import { PlayerSearchSheet } from '../components/PlayerSearchSheet';
import { chooseAiMove } from '../engine/ai';
import { cellCriteria, newGame, pass, play } from '../engine/game';
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

  const state = stateRef.current;
  const isAiTurn = config.mode === 'ai' && state.turn === AI_MARK && !state.winner;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // Tur sayacı: süre dolarsa pas.
  useEffect(() => {
    if (state.winner) return;
    setSecondsLeft(config.turnSeconds);
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
    return () => clearInterval(interval);
  }, [state.turn, state.winner, config.turnSeconds, bump]);

  // AI hamlesi.
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

  const resultText = () => {
    if (state.winner === 'draw') return t('draw', lang);
    if (config.mode === 'ai') {
      return state.winner === 'X' ? t('youWin', lang) : t('youLose', lang);
    }
    return state.winner === 'X' ? t('xWins', lang) : t('oWins', lang);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={styles.back}>‹ {t('home', lang)}</Text>
        </Pressable>
        <View style={[styles.timer, secondsLeft <= 5 && { borderColor: colors.danger }]}>
          <Text
            style={[styles.timerText, secondsLeft <= 5 && { color: colors.danger }]}
          >{`${secondsLeft}${t('seconds', lang)}`}</Text>
        </View>
      </View>

      <View style={styles.turnRow}>
        <Text style={[styles.turnText, { color: state.turn === 'X' ? colors.x : colors.o }]}>
          {config.mode === 'ai'
            ? isAiTurn
              ? t('aiTurn', lang)
              : t('yourTurn', lang)
            : `${t('turnOf', lang)}: ${state.turn}`}
        </Text>
        <Text style={styles.steals}>
          {t('steal', lang)}: {'⚡'.repeat(state.stealsLeft[state.turn])}
        </Text>
      </View>

      <Board state={state} onCellPress={onCellPress} disabled={!!state.winner || isAiTurn} />

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {state.winner && (
        <View style={styles.resultCard}>
          <Text style={styles.resultText}>{resultText()}</Text>
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
      )}

      <PlayerSearchSheet
        visible={selectedCell !== null}
        row={criteria?.row ?? null}
        col={criteria?.col ?? null}
        lang={lang}
        onSubmit={onSubmit}
        onClose={() => setSelectedCell(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60, paddingHorizontal: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: colors.textDim, fontSize: font.body, fontWeight: '700' },
  timer: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  timerText: { color: colors.primary, fontWeight: '800', fontSize: font.h2 },
  turnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  turnText: { fontSize: font.h2, fontWeight: '800' },
  steals: { color: colors.accent, fontSize: font.body, fontWeight: '700' },
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
  resultCard: {
    marginTop: 24,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 22,
    alignItems: 'center',
    gap: 16,
  },
  resultText: { color: colors.text, fontSize: font.h1, fontWeight: '900' },
  resultButtons: { flexDirection: 'row', gap: 12 },
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
