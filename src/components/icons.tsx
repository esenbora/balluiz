import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Uygulama genelinde kullanılan çizgi ikon seti (24×24 grid, 2px kontur).
// Emoji yerine tutarlı, profesyonel bir görsel dil sağlar.

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const defaults = { size: 20, color: '#FFFFFF', strokeWidth: 2 };

export function BotIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="8" width="16" height="11" rx="3" stroke={color} strokeWidth={2} />
      <Path d="M12 8 V4 M9 4 h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="9" cy="13" r="1.4" fill={color} />
      <Circle cx="15" cy="13" r="1.4" fill={color} />
      <Path d="M9.5 16.5 h5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function PeopleIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8.5" r="3" stroke={color} strokeWidth={2} />
      <Path d="M3.5 19 c0-3 2.5-5 5.5-5 s5.5 2 5.5 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="16.5" cy="9.5" r="2.4" stroke={color} strokeWidth={2} />
      <Path d="M16 14.4 c2.7 0.2 4.5 2 4.5 4.6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function SwordsIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4 L15 15 M4 4 l4 0.5 M4 4 l0.5 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M20 4 L9 15 M20 4 l-4 0.5 M20 4 l-0.5 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M7 17 l-2.5 2.5 M17 17 l2.5 2.5 M5.5 15.5 l3 3 M18.5 15.5 l-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function GlobeIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={2} />
      <Path d="M3.5 12 h17 M12 3.5 c-5.5 5.5-5.5 11.5 0 17 c5.5-5.5 5.5-11.5 0-17"
        stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function TrophyIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 4 h8 v5 a4 4 0 0 1-8 0 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M8 5.5 H4.5 a3.5 3.5 0 0 0 3.6 3.4 M16 5.5 h3.5 a3.5 3.5 0 0 1-3.6 3.4"
        stroke={color} strokeWidth={1.8} />
      <Path d="M12 13 v3.5 M8.5 20 h7 M10 16.5 h4 l1 3.5 h-6 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function FlameIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 c1 3-3.5 5-3.5 9 a5.5 5.5 0 0 0 11 0 c0-2.5-1.5-4.5-3-6 c0.2 2-0.5 3-1.5 3.5 C15.5 7 14 4.5 12 3 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BoltIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 3 L5.5 13.5 h5 L11 21 L18.5 10.5 h-5 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="6" width="16" height="14" rx="3" stroke={color} strokeWidth={2} />
      <Path d="M4 10.5 h16 M8.5 3.5 v4 M15.5 3.5 v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ShareIcon({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 14.5 V4 M8.5 7 L12 3.5 L15.5 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 11 H5.5 A1.5 1.5 0 0 0 4 12.5 v6 A1.5 1.5 0 0 0 5.5 20 h13 a1.5 1.5 0 0 0 1.5-1.5 v-6 A1.5 1.5 0 0 0 18.5 11 H18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
