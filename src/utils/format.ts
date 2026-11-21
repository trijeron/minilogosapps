import { Difficulty } from '../types/sudoku';
import { Language } from '../i18n/LanguageContext';

export function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getDifficultyLabel(diff: Difficulty, lang: Language = 'cs'): string {
  switch (diff) {
    case 'easy':
      return lang === 'en' ? 'Easy' : 'Lehká';
    case 'medium':
      return lang === 'en' ? 'Medium' : 'Střední';
    case 'hard':
      return lang === 'en' ? 'Hard' : 'Těžká';
  }
}
