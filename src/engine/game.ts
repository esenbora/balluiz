import type { CellState, GameConfig, GameState, GuessResult, Mark } from './types';
import { generateGrid, matches, solutions } from './grid';
import { ALL_PLAYERS, GamePlayer } from '../data';
import type { PlayerSeed } from '../data/players';
import { buildIndex, normalize, search } from './normalize';

export const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const nameIndex = buildIndex(ALL_PLAYERS, (p) => p.name);
const byNormName = new Map(ALL_PLAYERS.map((p) => [normalize(p.name), p]));

export function searchPlayers(query: string, limit = 8): GamePlayer[] {
  return search(nameIndex, query, limit, (p) => p.pop * 2.5);
}

export function findPlayerByName(name: string): GamePlayer | undefined {
  return byNormName.get(normalize(name));
}

export function newGame(config: GameConfig): GameState {
  return {
    config,
    grid: generateGrid(config.seed),
    cells: Array.from({ length: 9 }, (): CellState => ({ owner: null, playerName: null })),
    turn: 'X',
    usedNames: new Set(),
    stealsLeft: { X: config.stealsPerPlayer, O: config.stealsPerPlayer },
    winner: null,
    winLine: null,
  };
}

export function cellCriteria(state: GameState, index: number) {
  return { row: state.grid.rows[Math.floor(index / 3)], col: state.grid.cols[index % 3] };
}

export function cellSolutions(state: GameState, index: number): PlayerSeed[] {
  const { row, col } = cellCriteria(state, index);
  return solutions(row, col);
}

export function validGuess(state: GameState, index: number, player: PlayerSeed): boolean {
  const { row, col } = cellCriteria(state, index);
  return matches(player, row) && matches(player, col);
}

function checkEnd(state: GameState): void {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const o = state.cells[a].owner;
    if (o && state.cells[b].owner === o && state.cells[c].owner === o) {
      state.winner = o;
      state.winLine = line;
      return;
    }
  }
  if (state.cells.every((c) => c.owner !== null)) {
    const x = state.cells.filter((c) => c.owner === 'X').length;
    const o = state.cells.filter((c) => c.owner === 'O').length;
    state.winner = x === o ? 'draw' : x > o ? 'X' : 'O';
  }
}

/**
 * Hamle: `index` hücresine `playerName` cevabı. Doğruysa hücre işaretlenir,
 * yanlışsa sıra rakibe geçer (ceza). Dolu hücre = çalma hamlesi (steal hakkı düşer,
 * farklı ve geçerli bir oyuncu adı gerekir).
 */
export function play(state: GameState, index: number, playerName: string): GuessResult {
  if (state.winner) return { ok: false, reason: 'game-over' };
  const me = state.turn;
  const cell = state.cells[index];
  const isSteal = cell.owner !== null;

  if (isSteal) {
    if (cell.owner === me) return { ok: false, reason: 'cell-taken' };
    if (state.stealsLeft[me] <= 0) return { ok: false, reason: 'no-steals' };
  }

  const player = findPlayerByName(playerName);
  const key = player ? normalize(player.name) : normalize(playerName);
  if (state.usedNames.has(key)) {
    return { ok: false, reason: 'already-used' };
  }

  if (!player || !validGuess(state, index, player)) {
    // Yanlış cevap: sıra rakibe geçer, steal hakkı harcanmaz.
    state.turn = other(me);
    return { ok: false, reason: 'no-match' };
  }

  if (isSteal) state.stealsLeft[me] -= 1;
  state.usedNames.add(key);
  state.cells[index] = { owner: me, playerName: player.name };
  checkEnd(state);
  if (!state.winner) state.turn = other(me);
  return { ok: true };
}

/** Süre dolması veya pas: sıra rakibe geçer. */
export function pass(state: GameState): void {
  if (!state.winner) state.turn = other(state.turn);
}

export function other(mark: Mark): Mark {
  return mark === 'X' ? 'O' : 'X';
}
