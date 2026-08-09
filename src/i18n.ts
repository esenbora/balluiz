// Basit TR/EN sözlük. Varsayılan dil Türkçe; ayarlardan değiştirilebilir.
export type Lang = 'tr' | 'en';

const dict = {
  appName: { tr: 'Balluiz', en: 'Balluiz' },
  tagline: { tr: 'Futbol bilgisiyle XOX', en: 'Tic-tac-toe for football brains' },
  playAi: { tr: 'Bota Karşı Oyna', en: 'Play vs Bot' },
  playLocal: { tr: 'Arkadaşınla Aynı Telefonda', en: 'Two Players, One Phone' },
  dailyGrid: { tr: 'Günün Gridi', en: 'Daily Grid' },
  dailySub: { tr: 'Herkes aynı gridi çözüyor', en: 'Everyone plays the same grid' },
  challenge: { tr: 'Meydan Oku', en: 'Challenge' },
  challengeSub: { tr: 'Kodu paylaş, aynı gridde yarışın', en: 'Share a code, race on the same grid' },
  createChallenge: { tr: 'Yeni Kod Oluştur', en: 'Create New Code' },
  enterCode: { tr: 'Kod gir…', en: 'Enter code…' },
  invalidCode: { tr: 'Geçersiz kod', en: 'Invalid code' },
  start: { tr: 'Başla', en: 'Start' },
  online: { tr: 'Online Rakip', en: 'Online Match' },
  onlineSoon: { tr: 'Yakında', en: 'Coming soon' },
  difficulty: { tr: 'Zorluk', en: 'Difficulty' },
  easy: { tr: 'Kolay', en: 'Easy' },
  medium: { tr: 'Orta', en: 'Medium' },
  hard: { tr: 'Zor', en: 'Hard' },
  yourTurn: { tr: 'Sıra sende', en: 'Your turn' },
  aiTurn: { tr: 'Bot düşünüyor…', en: 'Bot is thinking…' },
  turnOf: { tr: 'Sıra', en: 'Turn' },
  searchPlayer: { tr: 'Futbolcu ara…', en: 'Search player…' },
  searchHint: {
    tr: 'İki kritere de uyan bir futbolcu yaz',
    en: 'Name a player matching both criteria',
  },
  wrong: { tr: 'Olmadı! Sıra rakibe geçti', en: 'Wrong! Turn passes' },
  used: { tr: 'Bu oyuncu bu maçta kullanıldı', en: 'Already used this match' },
  steal: { tr: 'Çalma hakkı', en: 'Steals left' },
  youWin: { tr: 'Kazandın!', en: 'You win!' },
  youLose: { tr: 'Kaybettin', en: 'You lost' },
  xWins: { tr: 'X kazandı!', en: 'X wins!' },
  oWins: { tr: 'O kazandı!', en: 'O wins!' },
  draw: { tr: 'Berabere', en: 'Draw' },
  rematch: { tr: 'Tekrar Oyna', en: 'Rematch' },
  home: { tr: 'Ana Menü', en: 'Home' },
  giveUp: { tr: 'Pas', en: 'Pass' },
  cancel: { tr: 'Vazgeç', en: 'Cancel' },
  seconds: { tr: 'sn', en: 's' },
  you: { tr: 'Sen', en: 'You' },
  bot: { tr: 'Bot', en: 'Bot' },
  player1: { tr: '1. Oyuncu', en: 'Player 1' },
  player2: { tr: '2. Oyuncu', en: 'Player 2' },
  possibleAnswers: { tr: 'olası cevap', en: 'possible answers' },
  howToTitle: { tr: 'Nasıl oynanır?', en: 'How to play' },
  howToText: {
    tr: 'Satır ve sütundaki iki kritere birden uyan futbolcuyu bul, hücreyi kap. Üçlüyü tamamlayan kazanır. Yanlış cevap sırayı rakibe verir; ⚡ ile dolu hücre çalınabilir.',
    en: 'Name a player matching both the row and column criteria to claim the cell. Three in a row wins. A wrong answer passes the turn; use ⚡ to steal an occupied cell.',
  },
  finalScore: { tr: 'Skor', en: 'Score' },
  share: { tr: 'Sonucu Paylaş', en: 'Share Result' },
  stats: { tr: 'İstatistikler', en: 'Statistics' },
  statPlayed: { tr: 'Oynanan', en: 'Played' },
  statWinRate: { tr: 'Kazanma', en: 'Win rate' },
  statStreak: { tr: 'Seri', en: 'Streak' },
  statBest: { tr: 'En iyi seri', en: 'Best streak' },
  code: { tr: 'Kod', en: 'Code' },
  credits: {
    tr: 'Veri: Wikidata (CC0) · Fotoğraflar: Wikimedia Commons',
    en: 'Data: Wikidata (CC0) · Photos: Wikimedia Commons',
  },
} as const;

export type TKey = keyof typeof dict;

export function t(key: TKey, lang: Lang): string {
  return dict[key][lang];
}
