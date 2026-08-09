import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { GameState } from '../engine/types';
import { CriterionChip } from './CriterionChip';
import { colors, radius } from '../theme';

interface Props {
  state: GameState;
  onCellPress: (index: number) => void;
  disabled: boolean;
}

export function Board({ state, onCellPress, disabled }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 24, 420);
  const head = size * 0.2;
  const cell = (size - head) / 3;

  return (
    <View style={{ width: size, alignSelf: 'center' }}>
      {/* Üst kriter satırı */}
      <View style={{ flexDirection: 'row', height: head }}>
        <View style={{ width: head }} />
        {state.grid.cols.map((c, i) => (
          <View key={i} style={{ width: cell, padding: 2 }}>
            <CriterionChip criterion={c} />
          </View>
        ))}
      </View>
      {[0, 1, 2].map((r) => (
        <View key={r} style={{ flexDirection: 'row', height: cell }}>
          <View style={{ width: head, padding: 2, justifyContent: 'center' }}>
            <CriterionChip criterion={state.grid.rows[r]} />
          </View>
          {[0, 1, 2].map((c) => {
            const idx = r * 3 + c;
            const cs = state.cells[idx];
            const inWinLine = state.winLine?.includes(idx);
            return (
              <Pressable
                key={c}
                onPress={() => onCellPress(idx)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.cell,
                  { width: cell - 6, height: cell - 6 },
                  cs.owner === 'X' && styles.cellX,
                  cs.owner === 'O' && styles.cellO,
                  inWinLine && styles.cellWin,
                  pressed && !cs.owner && styles.cellPressed,
                ]}
              >
                {cs.owner ? (
                  <>
                    <Text style={[styles.mark, { color: cs.owner === 'X' ? colors.x : colors.o }]}>
                      {cs.owner}
                    </Text>
                    <Text style={styles.playerName} numberOfLines={2}>
                      {cs.playerName}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.empty}>?</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    margin: 3,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellPressed: { backgroundColor: colors.surfaceHigh },
  cellX: { borderColor: colors.x, backgroundColor: '#12281F' },
  cellO: { borderColor: colors.o, backgroundColor: '#14213A' },
  cellWin: { borderWidth: 2, borderColor: colors.accent },
  mark: { fontSize: 26, fontWeight: '900' },
  playerName: { color: colors.textDim, fontSize: 9, textAlign: 'center', fontWeight: '600' },
  empty: { color: colors.border, fontSize: 22, fontWeight: '700' },
});
