import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { GameState } from '../engine/types';
import { findPlayerByName } from '../engine/game';
import { Avatar } from './Avatar';
import { CriterionChip } from './CriterionChip';
import { font, radius, useTheme, Palette } from '../theme';

interface Props {
  state: GameState;
  onCellPress: (index: number) => void;
  disabled: boolean;
}

// %12 opaklıkta iOS "tinted" zemin
function tinted(hex: string, alpha: string): string {
  return hex + alpha;
}

function Cell({
  owner,
  playerName,
  inWinLine,
  size,
  onPress,
  disabled,
  c,
}: {
  owner: 'X' | 'O' | null;
  playerName: string | null;
  inWinLine: boolean;
  size: number;
  onPress: () => void;
  disabled: boolean;
  c: Palette;
}) {
  const scale = useRef(new Animated.Value(owner ? 1 : 0)).current;

  useEffect(() => {
    if (owner) {
      scale.setValue(0.4);
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [owner, playerName, scale]);

  const tint = owner === 'X' ? c.x : owner === 'O' ? c.o : null;
  const player = playerName ? findPlayerByName(playerName) : undefined;
  const surname = playerName ? playerName.split(' ').slice(-1)[0] : '';

  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ width: size, height: size }}>
      {({ pressed }) => (
        <View
          style={[
            styles.cell,
            {
              backgroundColor: tint ? tinted(tint, '1F') : pressed ? c.fill : c.card,
              borderColor: inWinLine ? c.yellow : tint ?? c.dashed,
              borderWidth: inWinLine ? 2 : tint ? 1.5 : 1.5,
              borderStyle: owner ? 'solid' : 'dashed',
            },
          ]}
        >
          {owner ? (
            <Animated.View style={{ alignItems: 'center', transform: [{ scale }], gap: 3 }}>
              {player ? (
                <Avatar player={player} size={Math.max(30, size * 0.36)} />
              ) : (
                <Text style={[styles.mark, { color: tint! }]}>{owner === 'X' ? '✕' : '◯'}</Text>
              )}
              <Text style={[styles.playerName, { color: c.label }]} numberOfLines={1}>
                {surname}
              </Text>
              <View style={[styles.markBadge, { backgroundColor: tint! }]}>
                <Text style={styles.markBadgeText}>{owner}</Text>
              </View>
            </Animated.View>
          ) : (
            <Text style={[styles.empty, { color: c.secondaryLabel }]}>＋</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

export function Board({ state, onCellPress, disabled }: Props) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 24, 460);
  const head = 64;
  const cell = (size - head) / 3;

  return (
    <View style={{ width: size, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', height: head }}>
        <View style={{ width: head }} />
        {state.grid.cols.map((col, i) => (
          <View key={i} style={{ width: cell, padding: 2 }}>
            <CriterionChip criterion={col} />
          </View>
        ))}
      </View>
      {[0, 1, 2].map((r) => (
        <View key={r} style={{ flexDirection: 'row', height: cell }}>
          <View style={{ width: head, padding: 2, justifyContent: 'center' }}>
            <CriterionChip criterion={state.grid.rows[r]} />
          </View>
          {[0, 1, 2].map((col) => {
            const idx = r * 3 + col;
            const cs = state.cells[idx];
            return (
              <View key={col} style={{ padding: 3 }}>
                <Cell
                  owner={cs.owner}
                  playerName={cs.playerName}
                  inWinLine={state.winLine?.includes(idx) ?? false}
                  size={cell - 6}
                  onPress={() => onCellPress(idx)}
                  disabled={disabled}
                  c={c}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  mark: { fontSize: 24, fontWeight: '700' },
  playerName: { fontSize: 10, textAlign: 'center', fontWeight: '600' },
  markBadge: {
    position: 'absolute',
    top: -6,
    right: -30,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  empty: { fontSize: 28, fontWeight: '300' },
});
