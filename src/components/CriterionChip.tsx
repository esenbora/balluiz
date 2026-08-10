import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Criterion } from '../engine/types';
import { clubById, nationById } from '../data/clubs';
import { font, useTheme } from '../theme';
import { Crest } from './Crest';

// Satır/sütun kriteri: kulüpler arma, ülkeler bayrak gösterir.
export function CriterionChip({ criterion, crestSize = 34 }: { criterion: Criterion; crestSize?: number }) {
  const c = useTheme();
  if (criterion.kind === 'club') {
    const club = clubById.get(criterion.id);
    if (!club) return null;
    return (
      <View style={styles.wrap}>
        <Crest club={club} size={crestSize} />
        <Text
          style={[styles.label, { color: c.secondaryLabel }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {club.name}
        </Text>
      </View>
    );
  }
  const nation = nationById.get(criterion.id);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.flag, { fontSize: crestSize * 0.75 }]}>{nation?.flag ?? '🏳️'}</Text>
      <Text
        style={[styles.label, { color: c.secondaryLabel }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {nation?.name ?? criterion.id}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 3, flex: 1 },
  flag: { fontSize: font.h2 },
  label: { fontSize: 12, textAlign: 'center', fontWeight: '600' },
});
