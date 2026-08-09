import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Criterion } from '../engine/types';
import { clubById, nationById } from '../data/clubs';
import { font, radius, useTheme } from '../theme';

// Satır/sütun kriteri rozeti: kulüpler renkli kısaltma, ülkeler bayrak gösterir.
export function CriterionChip({ criterion }: { criterion: Criterion }) {
  const c = useTheme();
  if (criterion.kind === 'club') {
    const club = clubById.get(criterion.id);
    return (
      <View style={styles.wrap}>
        <View
          style={[
            styles.badge,
            { backgroundColor: club?.color ?? c.fill, borderColor: 'rgba(255,255,255,0.25)' },
          ]}
        >
          <Text style={styles.badgeText}>{club?.short ?? '?'}</Text>
        </View>
        <Text style={[styles.label, { color: c.secondaryLabel }]} numberOfLines={2}>
          {club?.name ?? criterion.id}
        </Text>
      </View>
    );
  }
  const nation = nationById.get(criterion.id);
  return (
    <View style={styles.wrap}>
      <Text style={styles.flag}>{nation?.flag ?? '🏳️'}</Text>
      <Text style={[styles.label, { color: c.secondaryLabel }]} numberOfLines={2}>
        {nation?.name ?? criterion.id}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 3, flex: 1 },
  badge: {
    minWidth: 44,
    paddingHorizontal: 8,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: font.small, letterSpacing: 0.3 },
  flag: { fontSize: 24 },
  label: { fontSize: 12, textAlign: 'center', fontWeight: '600' },
});
