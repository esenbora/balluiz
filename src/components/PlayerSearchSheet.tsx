import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { searchPlayers } from '../engine/game';
import type { PlayerSeed } from '../data/players';
import { nationById } from '../data/clubs';
import type { Criterion } from '../engine/types';
import { CriterionChip } from './CriterionChip';
import { font, radius, useTheme } from '../theme';
import { Lang, t } from '../i18n';

interface Props {
  visible: boolean;
  row: Criterion | null;
  col: Criterion | null;
  hintCount: number;
  lang: Lang;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

// Hücreye cevap girme sayfası: iOS sheet görünümü, anlık öneriler, TR karakter toleransı.
export function PlayerSearchSheet({ visible, row, col, hintCount, lang, onSubmit, onClose }: Props) {
  const c = useTheme();
  const [query, setQuery] = useState('');
  const suggestions = useMemo(() => (query.length >= 2 ? searchPlayers(query) : []), [query]);

  const submit = (name: string) => {
    setQuery('');
    onSubmit(name);
  };
  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={{ flex: 1 }} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: c.card }]}>
          <View style={[styles.grabber, { backgroundColor: c.tertiaryLabel }]} />
          <View style={styles.criteriaRow}>
            {row && <CriterionChip criterion={row} />}
            <Text style={[styles.plus, { color: c.secondaryLabel }]}>+</Text>
            {col && <CriterionChip criterion={col} />}
          </View>
          <Text style={[styles.hint, { color: c.secondaryLabel }]}>
            {t('searchHint', lang)} · {hintCount} {t('possibleAnswers', lang)}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.fill, color: c.label }]}
            value={query}
            onChangeText={setQuery}
            placeholder={'🔍  ' + t('searchPlayer', lang)}
            placeholderTextColor={c.secondaryLabel}
            autoFocus
            autoCorrect={false}
            autoCapitalize="words"
            onSubmitEditing={() => query.trim() && submit(query.trim())}
            returnKeyType="done"
          />
          <FlatList
            data={suggestions}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(p: PlayerSeed) => p.name}
            style={{ maxHeight: 250 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.suggestion,
                  { borderBottomColor: c.separator },
                  pressed && { backgroundColor: c.fill },
                ]}
                onPress={() => submit(item.name)}
              >
                <Text style={styles.suggestionFlag}>{nationById.get(item.nat)?.flag ?? ''}</Text>
                <Text style={[styles.suggestionText, { color: c.label }]}>{item.name}</Text>
                <Text style={[styles.suggestionPos, { color: c.tertiaryLabel }]}>{item.pos}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.cancel} onPress={close}>
            <Text style={[styles.cancelText, { color: c.tint }]}>{t('cancel', lang)}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 16,
    paddingTop: 8,
    gap: 10,
  },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, opacity: 0.4 },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  plus: { fontSize: font.h2, fontWeight: '600' },
  hint: { textAlign: 'center', fontSize: font.small },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: font.body,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionFlag: { fontSize: font.body },
  suggestionText: { fontSize: font.body, flex: 1, fontWeight: '500' },
  suggestionPos: { fontSize: font.small, fontWeight: '600' },
  cancel: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontWeight: '600', fontSize: font.body },
});
