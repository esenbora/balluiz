import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GameState, Mark } from '../engine/types';
import { colors, font, radius } from '../theme';

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
}: {
  mark: Mark;
  label: string;
  captured: number;
  steals: number;
  active: boolean;
}) {
  const color = mark === 'X' ? colors.x : colors.o;
  return (
    <View style={[styles.card, active && { borderColor: color, backgroundColor: colors.surfaceHigh }]}>
      <View style={[styles.markBadge, { backgroundColor: color }]}>
        <Text style={styles.markText}>{mark}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.steals}>{'⚡'.repeat(steals) || '—'}</Text>
      </View>
      <Text style={[styles.captured, { color }]}>{captured}</Text>
    </View>
  );
}

export function Scoreboard({ state, labelX, labelO }: Props) {
  const captured = (m: Mark) => state.cells.filter((c) => c.owner === m).length;
  return (
    <View style={styles.row}>
      <PlayerCard
        mark="X"
        label={labelX}
        captured={captured('X')}
        steals={state.stealsLeft.X}
        active={!state.winner && state.turn === 'X'}
      />
      <Text style={styles.vs}>VS</Text>
      <PlayerCard
        mark="O"
        label={labelO}
        captured={captured('O')}
        steals={state.stealsLeft.O}
        active={!state.winner && state.turn === 'O'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vs: { color: colors.textDim, fontWeight: '900', fontSize: font.small },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  markBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { color: colors.bg, fontWeight: '900', fontSize: 14 },
  label: { color: colors.text, fontWeight: '700', fontSize: font.small },
  steals: { color: colors.accent, fontSize: 10 },
  captured: { fontWeight: '900', fontSize: font.h1 },
});
