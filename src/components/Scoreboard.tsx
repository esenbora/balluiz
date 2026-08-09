import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GameState, Mark } from '../engine/types';
import { font, radius, useTheme, Palette } from '../theme';

interface Props {
  state: GameState;
  labelX: string;
  labelO: string;
}

function PlayerCard({
  mark,
  label,
  captured,
  steals,
  active,
  c,
}: {
  mark: Mark;
  label: string;
  captured: number;
  steals: number;
  active: boolean;
  c: Palette;
}) {
  const color = mark === 'X' ? c.x : c.o;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.card, borderColor: active ? color : 'transparent' },
      ]}
    >
      <View style={[styles.markBadge, { backgroundColor: color + '1F' }]}>
        <Text style={[styles.markText, { color }]}>{mark === 'X' ? '✕' : '◯'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: c.label }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.steals, { color: c.orange }]}>{'⚡'.repeat(steals) || '·'}</Text>
      </View>
      <Text style={[styles.captured, { color }]}>{captured}</Text>
    </View>
  );
}

export function Scoreboard({ state, labelX, labelO }: Props) {
  const c = useTheme();
  const captured = (m: Mark) => state.cells.filter((cell) => cell.owner === m).length;
  return (
    <View style={styles.row}>
      <PlayerCard
        mark="X"
        label={labelX}
        captured={captured('X')}
        steals={state.stealsLeft.X}
        active={!state.winner && state.turn === 'X'}
        c={c}
      />
      <PlayerCard
        mark="O"
        label={labelO}
        captured={captured('O')}
        steals={state.stealsLeft.O}
        active={!state.winner && state.turn === 'O'}
        c={c}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  markBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontWeight: '700', fontSize: font.sub },
  label: { fontWeight: '600', fontSize: font.small },
  steals: { fontSize: 10 },
  captured: { fontWeight: '700', fontSize: font.h2 },
});
