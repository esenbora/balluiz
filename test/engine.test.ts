import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, search, buildIndex } from '../src/engine/normalize';
import { generateGrid, solutions } from '../src/engine/grid';
import { newGame, play, pass, searchPlayers, findPlayerByName, cellSolutions } from '../src/engine/game';
import { chooseAiMove } from '../src/engine/ai';
import { PLAYERS } from '../src/data/players';
import { clubById, nationById } from '../src/data/clubs';
import type { GameConfig } from '../src/engine/types';

const CONFIG: GameConfig = {
  mode: 'ai',
  difficulty: 'hard',
  stealsPerPlayer: 3,
  turnSeconds: 30,
  seed: 42,
};

test('normalize Türkçe karakterleri katlar', () => {
  assert.equal(normalize('Hakan Şükür'), 'hakan sukur');
  assert.equal(normalize('İlkay Gündoğan'), 'ilkay gundogan');
  assert.equal(normalize('Çağlar Söyüncü'), 'caglar soyuncu');
});

test('arama aksansız sorguyla oyuncu bulur', () => {
  assert.equal(searchPlayers('sukur')[0]?.name, 'Hakan Şükür');
  assert.equal(searchPlayers('gundogan')[0]?.name, 'İlkay Gündoğan');
  assert.ok(searchPlayers('mess')[0]?.name.includes('Messi'));
});

test('soyadıyla önek araması çalışır', () => {
  const results = searchPlayers('oz');
  assert.ok(results.some((p) => p.name === 'Mesut Özil'));
});

test('veri bütünlüğü: kulüp ve ülke referansları geçerli', () => {
  for (const p of PLAYERS) {
    assert.ok(nationById.has(p.nat), `${p.name}: bilinmeyen ülke ${p.nat}`);
    assert.ok(p.clubs.length > 0, `${p.name}: kulüp yok`);
    for (const c of p.clubs) {
      assert.ok(clubById.has(c), `${p.name}: bilinmeyen kulüp ${c}`);
    }
  }
});

test('veri bütünlüğü: isimler benzersiz', () => {
  const seen = new Set<string>();
  for (const p of PLAYERS) {
    const key = normalize(p.name);
    assert.ok(!seen.has(key), `çift kayıt: ${p.name}`);
    seen.add(key);
  }
});

test('üretilen her gridde her hücrenin en az 2 çözümü var', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const grid = generateGrid(seed);
    for (const row of grid.rows) {
      for (const col of grid.cols) {
        const sols = solutions(row, col);
        assert.ok(
          sols.length >= 2,
          `seed ${seed}: ${JSON.stringify(row)} × ${JSON.stringify(col)} çözümsüz`,
        );
      }
    }
  }
});

test('doğru cevap hücreyi işaretler ve sırayı devreder', () => {
  const state = newGame(CONFIG);
  const player = cellSolutions(state, 0)[0];
  const result = play(state, 0, player.name);
  assert.equal(result.ok, true);
  assert.equal(state.cells[0].owner, 'X');
  assert.equal(state.turn, 'O');
});

test('yanlış cevap sırayı rakibe geçirir, hücre boş kalır', () => {
  const state = newGame(CONFIG);
  const result = play(state, 0, 'Böyle Bir Futbolcu Yok');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no-match');
  assert.equal(state.cells[0].owner, null);
  assert.equal(state.turn, 'O');
});

test('aynı oyuncu adı bir maçta iki kez kullanılamaz', () => {
  const state = newGame(CONFIG);
  const p0 = cellSolutions(state, 0)[0];
  play(state, 0, p0.name); // X
  // O aynı oyuncuyu başka bir hücrede denesin (geçerli olduğu bir hücre bul).
  for (let i = 1; i < 9; i++) {
    if (cellSolutions(state, i).some((p) => p.name === p0.name)) {
      const result = play(state, i, p0.name);
      assert.equal(result.reason, 'already-used');
      return;
    }
  }
});

test('çalma: dolu hücre farklı oyuncuyla alınabilir ve hak düşer', () => {
  const state = newGame(CONFIG);
  const sols = cellSolutions(state, 0);
  assert.ok(sols.length >= 2);
  play(state, 0, sols[0].name); // X aldı
  const result = play(state, 0, sols[1].name); // O çalıyor
  assert.equal(result.ok, true);
  assert.equal(state.cells[0].owner, 'O');
  assert.equal(state.stealsLeft.O, CONFIG.stealsPerPlayer - 1);
});

test('üç işaret aynı hizada kazanır', () => {
  const state = newGame(CONFIG);
  // X: 0,1,2 hücrelerini sırayla alsın; O araya pas geçsin.
  for (const idx of [0, 1, 2]) {
    const candidates = cellSolutions(state, idx).filter(
      (p) => !state.usedNames.has(normalize(p.name)),
    );
    assert.ok(candidates.length > 0);
    assert.equal(play(state, idx, candidates[0].name).ok, true);
    if (!state.winner) pass(state); // O pas
  }
  assert.equal(state.winner, 'X');
  assert.deepEqual(state.winLine, [0, 1, 2]);
});

test('AI zor seviyede geçerli hamle üretir', () => {
  const state = newGame(CONFIG);
  for (let i = 0; i < 20 && !state.winner; i++) {
    const move = chooseAiMove(state, 1000 + i);
    assert.equal(move.kind, 'answer', 'zor AI pas geçmemeli (çözüm varken)');
    const result = play(state, move.index!, move.player!.name);
    assert.equal(result.ok, true, `AI geçersiz hamle: ${move.player!.name}`);
  }
});

test('AI kazanan hamleyi görür', () => {
  const state = newGame(CONFIG);
  // O için 0 ve 1 hücrelerini elle işaretle; AI 2 numarayı seçmeli.
  state.cells[0] = { owner: 'O', playerName: 'test-a' };
  state.cells[1] = { owner: 'O', playerName: 'test-b' };
  state.turn = 'O';
  const move = chooseAiMove(state, 7);
  assert.equal(move.kind, 'answer');
  assert.equal(move.index, 2);
});

test('findPlayerByName aksan farklarını tolere eder', () => {
  assert.equal(findPlayerByName('hakan sukur')?.name, 'Hakan Şükür');
  assert.equal(findPlayerByName('HAKAN ŞÜKÜR')?.name, 'Hakan Şükür');
});

test('search jenerik altyapısı boş sorguda boş döner', () => {
  const idx = buildIndex(PLAYERS, (p) => p.name);
  assert.deepEqual(search(idx, '   '), []);
});
