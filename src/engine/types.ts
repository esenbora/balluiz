import type { PlayerSeed, Position } from '../data/players';

export type { PlayerSeed, Position };

export type Criterion =
  | { kind: 'club'; id: string }
  | { kind: 'nation'; id: string };

export interface Grid {
  rows: [Criterion, Criterion, Criterion];
  cols: [Criterion, Criterion, Criterion];
}

export type Mark = 'X' | 'O';

export interface CellState {
  owner: Mark | null;
  playerName: string | null;
}

export type GameMode = 'ai' | 'local';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  stealsPerPlayer: number;
  turnSeconds: number;
  seed: number;
}

export interface GameState {
  config: GameConfig;
  grid: Grid;
  cells: CellState[]; // 9 hücre, satır öncelikli (r*3+c)
  turn: Mark;
  usedNames: Set<string>; // aynı maçta bir oyuncu adı bir kez kullanılabilir
  stealsLeft: Record<Mark, number>;
  winner: Mark | 'draw' | null;
  winLine: number[] | null;
}

export interface GuessResult {
  ok: boolean;
  reason?: 'no-match' | 'already-used' | 'cell-taken' | 'no-steals' | 'game-over';
}
