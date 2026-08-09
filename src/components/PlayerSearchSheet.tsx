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
import { colors, radius } from '../theme';
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

// Hücreye cevap girme alt sayfası: anlık öneriler, Türkçe karakter toleransı.
export function PlayerSearchSheet({ visible, row, col, hintCount, lang, onSubmit, onClose }: Props) {
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
        <View style={styles.sheet}>
          <View style={styles.criteriaRow}>
            {row && <CriterionChip criterion={row} />}
            <Text style={styles.plus}>+</Text>
            {col && <CriterionChip criterion={col} />}
          </View>
          <Text style={styles.hint}>
            {t('searchHint', lang)} · {hintCount} {t('possibleAnswers', lang)}
          </Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchPlayer', lang)}
            placeholderTextColor={colors.textDim}
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
            style={{ maxHeight: 240 }}
            renderItem={({ item }) => (
              <Pressable style={styles.suggestion} onPress={() => submit(item.name)}>
                <Text style={styles.suggestionFlag}>{nationById.get(item.nat)?.flag ?? ''}</Text>
                <Text style={styles.suggestionText}>{item.name}</Text>
                <Text style={styles.suggestionPos}>{item.pos}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.cancel} onPress={close}>
            <Text style={styles.cancelText}>{t('cancel', lang)}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  plus: { color: colors.accent, fontSize: 20, fontWeight: '800' },
  hint: { color: colors.textDim, textAlign: 'center', fontSize: 12 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionFlag: { fontSize: 18 },
  suggestionText: { color: colors.text, fontSize: 15, flex: 1, fontWeight: '600' },
  suggestionPos: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  cancel: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: colors.textDim, fontWeight: '700' },
});
