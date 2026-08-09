// Yerel istatistik ve seri (streak) takibi — cihazda kalır, hesap gerektirmez.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailyNumber } from './daily';

export interface Stats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number; // günün gridi üst üste kaç gün oynandı
  bestStreak: number;
  lastDailyNo: number | null; // en son oynanan günün gridi numarası
}

export const EMPTY_STATS: Stats = {
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  streak: 0,
  bestStreak: 0,
  lastDailyNo: null,
};

const KEY = 'balluiz.stats.v1';

export async function loadStats(): Promise<Stats> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_STATS };
    return { ...EMPTY_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export async function recordResult(
  result: 'win' | 'loss' | 'draw',
  daily: boolean,
): Promise<Stats> {
  const stats = await loadStats();
  stats.played += 1;
  if (result === 'win') stats.wins += 1;
  else if (result === 'loss') stats.losses += 1;
  else stats.draws += 1;

  if (daily) {
    const no = dailyNumber();
    if (stats.lastDailyNo !== no) {
      stats.streak = stats.lastDailyNo === no - 1 ? stats.streak + 1 : 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
      stats.lastDailyNo = no;
    }
  }
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // depolama hatası oyunu engellemesin
  }
  return stats;
}
