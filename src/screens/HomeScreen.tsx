import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Difficulty, GameMode } from '../engine/types';
import { font, radius, useTheme } from '../theme';
import { Lang, t } from '../i18n';
import { codeToSeed, dailyNumber, seedToCode } from '../social/daily';
import { EMPTY_STATS, Stats, loadStats } from '../social/stats';

interface Props {
  lang: Lang;
  difficulty: Difficulty;
  refreshKey: number;
  onChangeLang: (lang: Lang) => void;
  onChangeDifficulty: (d: Difficulty) => void;
  onStart: (mode: GameMode) => void;
  onStartDaily: () => void;
  onStartChallenge: (seed: number, code: string) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export function HomeScreen({
  lang,
  difficulty,
  refreshKey,
  onChangeLang,
  onChangeDifficulty,
  onStart,
  onStartDaily,
  onStartChallenge,
}: Props) {
  const c = useTheme();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    loadStats().then(setStats);
  }, [refreshKey]);

  const startWithCode = () => {
    const seed = codeToSeed(codeInput);
    if (seed === null) {
      setCodeError(true);
      return;
    }
    setChallengeOpen(false);
    setCodeInput('');
    setCodeError(false);
    onStartChallenge(seed, seedToCode(seed));
  };

  const createChallenge = () => {
    const seed = Math.floor(Math.random() * 2 ** 31);
    setChallengeOpen(false);
    onStartChallenge(seed, seedToCode(seed));
  };

  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Büyük başlık + dil */}
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.largeTitle, { color: c.label }]}>{t('appName', lang)}</Text>
          <Text style={[styles.subtitle, { color: c.secondaryLabel }]}>{t('tagline', lang)}</Text>
        </View>
        <Pressable
          onPress={() => onChangeLang(lang === 'tr' ? 'en' : 'tr')}
          style={[styles.langBtn, { backgroundColor: c.fill }]}
        >
          <Text style={[styles.langText, { color: c.tint }]}>{lang.toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* Günün Gridi — öne çıkan kart */}
      <Pressable
        onPress={onStartDaily}
        style={({ pressed }) => [
          styles.dailyCard,
          { backgroundColor: c.tint, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.dailyTitle}>
            📅 {t('dailyGrid', lang)} #{dailyNumber()}
          </Text>
          <Text style={styles.dailySub}>{t('dailySub', lang)}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {/* Modlar — gruplu liste */}
      <View style={[styles.group, { backgroundColor: c.card }]}>
        <Row
          icon="🤖"
          title={t('playAi', lang)}
          onPress={() => onStart('ai')}
          c={c}
        />
        <Separator c={c} />
        <Row icon="👥" title={t('playLocal', lang)} onPress={() => onStart('local')} c={c} />
        <Separator c={c} />
        <Row
          icon="⚔️"
          title={t('challenge', lang)}
          subtitle={t('challengeSub', lang)}
          onPress={() => setChallengeOpen(true)}
          c={c}
        />
        <Separator c={c} />
        <Row icon="🌍" title={t('online', lang)} subtitle={t('onlineSoon', lang)} disabled c={c} />
      </View>

      {/* Zorluk — segmented control */}
      <Text style={[styles.sectionHeader, { color: c.secondaryLabel }]}>
        {t('difficulty', lang).toUpperCase()}
      </Text>
      <View style={[styles.segmented, { backgroundColor: c.fill }]}>
        {DIFFICULTIES.map((d) => (
          <Pressable
            key={d}
            onPress={() => onChangeDifficulty(d)}
            style={[
              styles.segment,
              difficulty === d && { backgroundColor: c.card, ...styles.segmentActive },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: difficulty === d ? c.label : c.secondaryLabel },
              ]}
            >
              {t(d, lang)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* İstatistikler */}
      <Text style={[styles.sectionHeader, { color: c.secondaryLabel }]}>
        {t('stats', lang).toUpperCase()}
      </Text>
      <View style={[styles.group, styles.statsRow, { backgroundColor: c.card }]}>
        <Stat value={String(stats.played)} label={t('statPlayed', lang)} c={c} />
        <StatDivider c={c} />
        <Stat value={`%${winRate}`} label={t('statWinRate', lang)} c={c} />
        <StatDivider c={c} />
        <Stat value={`${stats.streak}🔥`} label={t('statStreak', lang)} c={c} />
        <StatDivider c={c} />
        <Stat value={String(stats.bestStreak)} label={t('statBest', lang)} c={c} />
      </View>

      {/* Nasıl oynanır */}
      <View style={[styles.group, { backgroundColor: c.card, padding: 14, gap: 5 }]}>
        <Text style={[styles.howToTitle, { color: c.label }]}>{t('howToTitle', lang)}</Text>
        <Text style={[styles.howToText, { color: c.secondaryLabel }]}>{t('howToText', lang)}</Text>
      </View>

      {/* Meydan okuma modalı */}
      <Modal visible={challengeOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: c.card }]}>
            <Text style={[styles.modalTitle, { color: c.label }]}>⚔️ {t('challenge', lang)}</Text>
            <Text style={[styles.modalSub, { color: c.secondaryLabel }]}>
              {t('challengeSub', lang)}
            </Text>
            <TextInput
              style={[
                styles.codeInput,
                { backgroundColor: c.fill, color: c.label },
                codeError && { borderWidth: 1, borderColor: c.red },
              ]}
              value={codeInput}
              onChangeText={(v) => {
                setCodeInput(v);
                setCodeError(false);
              }}
              placeholder={t('enterCode', lang)}
              placeholderTextColor={c.secondaryLabel}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {codeError && (
              <Text style={{ color: c.red, fontSize: font.small }}>{t('invalidCode', lang)}</Text>
            )}
            <Pressable
              style={[styles.modalBtn, { backgroundColor: c.tint }]}
              onPress={startWithCode}
            >
              <Text style={styles.modalBtnText}>{t('start', lang)}</Text>
            </Pressable>
            <Pressable style={[styles.modalBtn, { backgroundColor: c.fill }]} onPress={createChallenge}>
              <Text style={[styles.modalBtnText, { color: c.tint }]}>
                {t('createChallenge', lang)}
              </Text>
            </Pressable>
            <Pressable style={{ paddingVertical: 8 }} onPress={() => setChallengeOpen(false)}>
              <Text style={{ color: c.secondaryLabel, textAlign: 'center', fontSize: font.sub }}>
                {t('cancel', lang)}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  c,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
  c: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.fill }]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: disabled ? c.tertiaryLabel : c.label }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.rowSub, { color: c.secondaryLabel }]}>{subtitle}</Text>
        )}
      </View>
      {!disabled && <Text style={[styles.rowChevron, { color: c.tertiaryLabel }]}>›</Text>}
    </Pressable>
  );
}

function Separator({ c }: { c: ReturnType<typeof useTheme> }) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: c.separator,
        marginLeft: 54,
      }}
    />
  );
}

function Stat({
  value,
  label,
  c,
}: {
  value: string;
  label: string;
  c: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: c.label }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.secondaryLabel }]}>{label}</Text>
    </View>
  );
}

function StatDivider({ c }: { c: ReturnType<typeof useTheme> }) {
  return <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: c.separator }} />;
}

const styles = StyleSheet.create({
  content: { paddingTop: 68, paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  largeTitle: { fontSize: font.largeTitle, fontWeight: '700', letterSpacing: 0.3 },
  subtitle: { fontSize: font.sub, marginTop: 2 },
  langBtn: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 6,
  },
  langText: { fontWeight: '600', fontSize: font.small },
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: 18,
    gap: 8,
  },
  dailyTitle: { color: '#fff', fontSize: font.body, fontWeight: '700' },
  dailySub: { color: 'rgba(255,255,255,0.75)', fontSize: font.small, marginTop: 2 },
  chevron: { color: 'rgba(255,255,255,0.7)', fontSize: 26, fontWeight: '600' },
  group: { borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon: { fontSize: font.h2, width: 28, textAlign: 'center' },
  rowTitle: { fontSize: font.body, fontWeight: '500' },
  rowSub: { fontSize: font.small, marginTop: 1 },
  rowChevron: { fontSize: font.h2, fontWeight: '500' },
  sectionHeader: { fontSize: font.small, fontWeight: '500', marginLeft: 14, marginBottom: -6 },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 2 },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.md - 2,
    alignItems: 'center',
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentText: { fontSize: font.small, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: font.h2, fontWeight: '700' },
  statLabel: { fontSize: font.caption },
  howToTitle: { fontSize: font.sub, fontWeight: '600' },
  howToText: { fontSize: font.small, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: 20,
    gap: 10,
  },
  modalTitle: { fontSize: font.h2, fontWeight: '700', textAlign: 'center' },
  modalSub: { fontSize: font.small, textAlign: 'center' },
  codeInput: {
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: font.body,
    textAlign: 'center',
    letterSpacing: 2,
  },
  modalBtn: { borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '600', fontSize: font.body },
});
