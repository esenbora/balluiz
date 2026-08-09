import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Difficulty, GameMode } from '../engine/types';
import { colors, font, radius } from '../theme';
import { Lang, t } from '../i18n';

interface Props {
  lang: Lang;
  difficulty: Difficulty;
  onChangeLang: (lang: Lang) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  onStart: (mode: GameMode) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export function HomeScreen({ lang, difficulty, onChangeLang, onChangeDifficulty, onStart }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.langRow}>
        {(['tr', 'en'] as Lang[]).map((l) => (
          <Pressable
            key={l}
            onPress={() => onChangeLang(l)}
            style={[styles.langBtn, lang === l && styles.langBtnActive]}
          >
            <Text style={[styles.langText, lang === l && styles.langTextActive]}>
              {l.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.hero}>
        <View style={styles.logoRing}>
          <Text style={styles.logoBall}>⚽</Text>
        </View>
        <Text style={styles.title}>{t('appName', lang)}</Text>
        <Text style={styles.tagline}>{t('tagline', lang)}</Text>
      </View>

      <View style={styles.menu}>
        <Pressable style={styles.primaryBtn} onPress={() => onStart('ai')}>
          <Text style={styles.primaryBtnText}>{t('playAi', lang)}</Text>
        </Pressable>

        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyLabel}>{t('difficulty', lang)}</Text>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d}
              onPress={() => onChangeDifficulty(d)}
              style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
            >
              <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
                {t(d, lang)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.secondaryBtn} onPress={() => onStart('local')}>
          <Text style={styles.secondaryBtnText}>{t('playLocal', lang)}</Text>
        </Pressable>

        <View style={[styles.secondaryBtn, styles.disabledBtn]}>
          <Text style={styles.secondaryBtnText}>{t('online', lang)}</Text>
          <Text style={styles.soon}>{t('onlineSoon', lang)}</Text>
        </View>

        <View style={styles.howTo}>
          <Text style={styles.howToTitle}>{t('howToTitle', lang)}</Text>
          <Text style={styles.howToText}>{t('howToText', lang)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60, paddingHorizontal: 24 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  langBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { color: colors.textDim, fontWeight: '800', fontSize: font.small },
  langTextActive: { color: colors.bg },
  hero: { alignItems: 'center', marginTop: 36, marginBottom: 32, gap: 8 },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  logoBall: { fontSize: 48 },
  title: { color: colors.text, fontSize: font.title, fontWeight: '900', letterSpacing: 1 },
  tagline: { color: colors.textDim, fontSize: font.body },
  menu: { gap: 14 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.bg, fontWeight: '900', fontSize: font.h2 },
  difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  difficultyLabel: { color: colors.textDim, fontWeight: '700', fontSize: font.small },
  diffBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  diffBtnActive: { backgroundColor: colors.surfaceHigh, borderColor: colors.primary },
  diffText: { color: colors.textDim, fontWeight: '700', fontSize: font.small },
  diffTextActive: { color: colors.primary },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  secondaryBtnText: { color: colors.text, fontWeight: '800', fontSize: font.body },
  disabledBtn: { opacity: 0.55 },
  soon: { color: colors.accent, fontSize: font.small, fontWeight: '600' },
  howTo: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: 14,
    gap: 6,
  },
  howToTitle: { color: colors.accent, fontWeight: '800', fontSize: font.small },
  howToText: { color: colors.textDim, fontSize: font.small, lineHeight: 18 },
});
