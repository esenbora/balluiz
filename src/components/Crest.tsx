import React from 'react';
import { Image, View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { Club } from '../data/clubs';
import { CREST_ASSETS } from '../data/crestAssets';

// Kulüp arması — iki katmanlı strateji:
// 1) Wikimedia Commons'tan alınan serbest lisanslı gerçek armalar uygulama
//    paketine gömülüdür (ağ gerekmez; kaynak/atıf: src/data/crests.json).
//    Koyu temada da okunması için beyaz plaka üstünde durur.
// 2) Commons'ta arması olmayan kulüplerde kulüp renklerinde özgün çizim
//    kalkana düşülür. Kalkan deseni kulüp kimliğinden deterministiktir.
// Marka hukuku notu için bkz. docs/ANALIZ.md.

const SHIELD = 'M50 3 L94 14 V52 C94 79 74 98 50 106 C26 98 6 79 6 52 V14 Z';

function hashOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function textColor(bg: string): string {
  const hex = bg.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1A1A1A' : '#FFFFFF';
}

function ShieldCrest({ club, size }: { club: Club; size: number }) {
  const variant = hashOf(club.id) % 3;
  return (
    <Svg width={size} height={size * 1.09} viewBox="0 0 100 109">
      <Defs>
        <ClipPath id={`clip-${club.id}`}>
          <Path d={SHIELD} />
        </ClipPath>
      </Defs>
      <Path d={SHIELD} fill={club.color} />
      {variant === 0 && (
        <Rect x="0" y="0" width="100" height="30" fill={club.alt} clipPath={`#clip-${club.id}`} />
      )}
      {variant === 1 && (
        <Rect x="50" y="0" width="50" height="109" fill={club.alt} clipPath={`#clip-${club.id}`} />
      )}
      {variant === 2 && (
        <Path
          d="M-10 78 L78 -10 L108 20 L20 108 Z"
          fill={club.alt}
          opacity={0.9}
          clipPath={`#clip-${club.id}`}
        />
      )}
      <Path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={4} />
      <Rect x="12" y="42" width="76" height="30" rx="8" fill="rgba(0,0,0,0.35)" />
      <SvgText
        x="50"
        y="64"
        fontSize={club.short.length > 3 ? 20 : 24}
        fontWeight="800"
        fill="#FFFFFF"
        textAnchor="middle"
      >
        {club.short}
      </SvgText>
    </Svg>
  );
}

export function Crest({ club, size = 34 }: { club: Club; size?: number }) {
  const asset = CREST_ASSETS[club.id];

  if (!asset) return <ShieldCrest club={club} size={size} />;

  // Gerçek arma (paket içi): koyu temada da okunması için beyaz plaka üstünde.
  return (
    <View style={{ width: size, height: size * 1.09, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.26,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.15)',
        }}
      >
        <Image
          source={asset}
          style={{ width: size * 0.82, height: size * 0.82 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
