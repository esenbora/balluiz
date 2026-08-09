// Basit TR/EN sözlük. Varsayılan dil Türkçe; ayarlardan değiştirilebilir.
export type Lang = 'tr' | 'en';

const dict = {
  appName: { tr: 'Balluiz', en: 'Balluiz' },
  tagline: { tr: 'Futbol bilgisiyle XOX', en: 'Tic-tac-toe for football brains' },
  playAi: { tr: 'Tek Kişilik (Bota Karşı)', en: 'Single Player (vs Bot)' },
  playLocal: { tr: 'İki Kişilik (Aynı Telefon)', en: 'Two Players (Same Phone)' },
  online: { tr: 'Online Rakip', en: 'Online Match' },
  onlineSoon: { tr: 'Yakında — gerçek rakiplere karşı', en: 'Coming soon — vs real opponents' },
  difficulty: { tr: 'Zorluk', en: 'Difficulty' },
  easy: { tr: 'Kolay', en: 'Easy' },
  medium: { tr: 'Orta', en: 'Medium' },
  hard: { tr: 'Zor', en: 'Hard' },
  language: { tr: 'Dil', en: 'Language' },
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
  youWin: { tr: 'Kazandın! 🏆', en: 'You win! 🏆' },
  youLose: { tr: 'Kaybettin 😔', en: 'You lost 😔' },
  xWins: { tr: 'X kazandı! 🏆', en: 'X wins! 🏆' },
  oWins: { tr: 'O kazandı! 🏆', en: 'O wins! 🏆' },
  draw: { tr: 'Berabere 🤝', en: 'Draw 🤝' },
  rematch: { tr: 'Tekrar Oyna', en: 'Rematch' },
  home: { tr: 'Ana Menü', en: 'Home' },
  giveUp: { tr: 'Pas', en: 'Pass' },
  cancel: { tr: 'Vazgeç', en: 'Cancel' },
  seconds: { tr: 'sn', en: 's' },
} as const;

export type TKey = keyof typeof dict;

export function t(key: TKey, lang: Lang): string {
  return dict[key][lang];
}
