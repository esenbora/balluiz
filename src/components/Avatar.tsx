import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { GamePlayer } from '../data';
import { photoUrl } from '../data';
import { clubById } from '../data/clubs';
import { useTheme } from '../theme';

// Oyuncu avatarı: Wikimedia Commons fotoğrafı varsa gösterir (çevrimdışıysa
// veya yüklenemezse baş harflere düşer). Fotoğrafsız oyuncularda ilk kulübün
// rengiyle baş harf monogramı.
export function Avatar({ player, size = 36 }: { player: GamePlayer; size?: number }) {
  const c = useTheme();
  const [failed, setFailed] = useState(false);
  const initials = player.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const clubColor = clubById.get(player.clubs[0])?.color ?? c.fill;

  const showPhoto = player.photo && !failed;
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: clubColor },
      ]}
    >
      {/* Baş harfler her zaman altta: fotoğraf yüklenene kadar boş daire görünmez */}
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
      {showPhoto && (
        <Image
          source={{ uri: photoUrl(player.photo!, size * 3) }}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: '#fff', fontWeight: '700' },
});
