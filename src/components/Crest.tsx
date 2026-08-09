import React from 'react';
import Svg, { ClipPath, Defs, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { Club } from '../data/clubs';

// Kulüp arması: klasik kalkan formu, kulübün gerçek renkleriyle.
// Gerçek logolar tescilli marka olduğu için (lisans gerektirir) armalar
// özgün çizimdir; kulüp kimliği renk + kısaltma ile verilir.
// Desen varyantı kulüp kimliğinden deterministik seçilir: her kulübün
// arması her zaman aynı görünür.

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

export function Crest({ club, size = 34 }: { club: Club; size?: number }) {
  const variant = hashOf(club.id) % 3;
  const label = textColor(club.color);
  return (
    <Svg width={size} height={size * 1.09} viewBox="0 0 100 109">
      <Defs>
        <ClipPath id={`clip-${club.id}`}>
          <Path d={SHIELD} />
        </ClipPath>
      </Defs>
      <Path d={SHIELD} fill={club.color} />
      {variant === 0 && (
        // Üst bant
        <Rect x="0" y="0" width="100" height="30" fill={club.alt} clipPath={`#clip-${club.id}`} />
      )}
      {variant === 1 && (
        // Dikey yarı
        <Rect x="50" y="0" width="50" height="109" fill={club.alt} clipPath={`#clip-${club.id}`} />
      )}
      {variant === 2 && (
        // Çapraz şerit
        <Path
          d="M-10 78 L78 -10 L108 20 L20 108 Z"
          fill={club.alt}
          opacity={0.9}
          clipPath={`#clip-${club.id}`}
        />
      )}
      <Path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={4} />
      <Path
        d={SHIELD}
        fill="none"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={1.5}
        transform="translate(0 2)"
      />
      {/* Kısaltma plakası: her varyantta okunur kalması için yarı saydam zemin */}
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
