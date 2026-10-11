import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Marks a control so the live site can show the hover sheen and the press-in. */
export const pressSolid = { dlPress: 'solid' } as const;
export const pressGhost = { dlPress: 'ghost' } as const;

const CSS = `
[data-dl-press="solid"],
[data-dl-press="ghost"] {
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), filter 0.25s ease, box-shadow 0.25s ease;
}
[data-dl-press="solid"] {
  position: relative;
  overflow: hidden;
}
[data-dl-press="solid"]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.34) 50%, transparent 68%);
  transform: translateX(-130%);
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}
[data-dl-press="solid"]:hover {
  filter: brightness(1.08);
  box-shadow: 0 12px 32px -12px rgba(210, 13, 30, 0.9);
}
[data-dl-press="solid"]:hover::after {
  transform: translateX(130%);
}
[data-dl-press="ghost"]:hover {
  filter: brightness(1.12);
}
[data-dl-press="solid"]:active,
[data-dl-press="ghost"]:active {
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  [data-dl-press="solid"],
  [data-dl-press="ghost"],
  [data-dl-press="solid"]::after {
    transition: none !important;
  }
  [data-dl-press="solid"]::after { display: none; }
}
`;

/** Hover brightens and a light streak crosses the button. A click presses it in. */
export function ButtonPressStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('dl-btn-press')) return;
    const style = document.createElement('style');
    style.id = 'dl-btn-press';
    style.textContent = CSS;
    document.head.appendChild(style);
  }, []);
  return null;
}
