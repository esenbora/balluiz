import type { Difficulty, GameState, Mark } from './types';
import { WIN_LINES, cellSolutions, other } from './game';
import { normalize } from './normalize';
import { rng } from './grid';
import type { PlayerSeed } from '../data/players';

// Zorluk = doğru cevap verme olasılığı + taktik derinlik.
const ACCURACY: Record<Difficulty, number> = { easy: 0.55, medium: 0.82, hard: 0.97 };

export interface AiMove {
  kind: 'answer' | 'pass';
  index?: number;
  player?: PlayerSeed;
}

function lineScore(state: GameState, index: number, me: Mark): number {
  // Kazanma > rakibi bloklama > merkez > köşe önceliği.
  let score = 0;
  const opp = other(me);
  for (const line of WIN_LINES) {
    if (!line.includes(index)) continue;
    const owners = line.map((i) => (i === index ? me : state.cells[i].owner));
    const mine = owners.filter((o) => o === me).length;
    const theirs = owners.filter((o) => o === opp).length;
    if (mine === 3) score += 1000; // kazanan hamle
    else if (theirs === 0 && mine === 2) score += 40;
    else if (theirs === 0) score += 8;
  }
  for (const line of WIN_LINES) {
    if (!line.includes(index)) continue;
    const opp2 = line.filter((i) => i !== index && state.cells[i].owner === opp).length;
    const empty = line.filter((i) => i !== index && state.cells[i].owner === null).length;
    if (opp2 === 2 && empty === 0) score += 500; // rakibin kazanmasını blokla
  }
  if (index === 4) score += 5;
  if ([0, 2, 6, 8].includes(index)) score += 2;
  return score;
}

/**
 * AI hamlesi seçer. Sadece "adil bilgi" kullanır: hücre kriterlerine uyan ve
 * henüz kullanılmamış oyuncular. Zorluk düştükçe hem cevap isabeti hem hücre
 * seçimi zayıflar.
 */
export function chooseAiMove(state: GameState, seed: number): AiMove {
  const me = state.turn;
  const rand = rng(seed);
  const difficulty = state.config.difficulty;

  const candidates: { index: number; players: PlayerSeed[]; score: number; steal: boolean }[] = [];
  for (let i = 0; i < 9; i++) {
    const cell = state.cells[i];
    const steal = cell.owner !== null;
    if (steal && (cell.owner === me || state.stealsLeft[me] <= 0)) continue;
    const players = cellSolutions(state, i).filter(
      (p) => !state.usedNames.has(normalize(p.name)),
    );
    if (players.length === 0) continue;
    let score = lineScore(state, i, me);
    if (steal) score -= difficulty === 'hard' ? 25 : 60; // çalmayı kritik anlara sakla
    candidates.push({ index: i, players, score, steal });
  }

  if (candidates.length === 0) return { kind: 'pass' };

  // Yanılma payı: kolay AI bazen bilemez ve pas geçer.
  if (rand() > ACCURACY[difficulty]) return { kind: 'pass' };

  candidates.sort((a, b) => b.score - a.score);
  const top =
    difficulty === 'hard'
      ? candidates[0]
      : candidates[Math.floor(rand() * Math.min(candidates.length, difficulty === 'medium' ? 2 : 4))];

  const player = top.players[Math.floor(rand() * top.players.length)];
  return { kind: 'answer', index: top.index, player };
}
