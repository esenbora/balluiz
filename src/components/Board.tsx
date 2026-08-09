import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { GameState } from '../engine/types';
import { CriterionChip } from './CriterionChip';
import { colors, radius } from '../theme';

interface Props {
  state: GameState;
  onCellPress: (index: number) => void;
  disabled: boolean;
}

// Tek hücre: işaret konduğunda yaylı büyüme, kazanan çizgide parlama animasyonu.
function Cell({
  owner,
  playerName,
  inWinLine,
  size,
  onPress,
  disabled,
}: {
  owner: 'X' | 'O' | null;
  playerName: string | null;
  inWinLine: boolean;
  size: number;
  onPress: () => void;
  disabled: boolean;
}) {
  const scale = useRef(new Animated.Value(owner ? 1 : 0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (owner) {
      scale.setValue(0.2);
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [owner, playerName, scale]);

  useEffect(() => {
    if (!inWinLine) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [inWinLine, glow]);

  const borderColor = inWinLine
    ? glow.interpolate({ inputRange: [0, 1], outputRange: [colors.accent, '#FFF3C4'] })
    : owner === 'X'
      ? colors.x
      : owner === 'O'
        ? colors.o
        : colors.border;

  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: size, height: size }}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.cell,
            owner === 'X' && styles.cellX,
            owner === 'O' && styles.cellO,
            pressed && !owner && styles.cellPressed,
            { borderColor, borderWidth: inWinLine ? 2.5 : 1 },
          ]}
        >
          {owner ? (
            <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
              <Text style={[styles.mark, { color: owner === 'X' ? colors.x : colors.o }]}>
                {owner}
              </Text>
              <Text style={styles.playerName} numberOfLines={2}>
                {playerName}
              </Text>
            </Animated.View>
          ) : (
            <Text style={styles.empty}>+</Text>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

export function Board({ state, onCellPress, disabled }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 24, 420);
  const head = size * 0.2;
  const cell = (size - head) / 3;

  return (
    <View style={{ width: size, alignSelf: 'center' }}>
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
            return (
              <View key={c} style={{ padding: 3 }}>
                <Cell
                  owner={cs.owner}
                  playerName={cs.playerName}
                  inWinLine={state.winLine?.includes(idx) ?? false}
                  size={cell - 6}
                  onPress={() => onCellPress(idx)}
                  disabled={disabled}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellPressed: { backgroundColor: colors.surfaceHigh },
  cellX: { backgroundColor: '#12281F' },
  cellO: { backgroundColor: '#14213A' },
  mark: { fontSize: 26, fontWeight: '900' },
  playerName: { color: colors.textDim, fontSize: 9, textAlign: 'center', fontWeight: '600' },
  empty: { color: colors.border, fontSize: 24, fontWeight: '300' },
});
