import { Difficulty } from '../types/sudoku';

export function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getDifficultyLabel(diff: Difficulty): string {
  switch (diff) {
    case 'easy':
      return 'Lehká';
    case 'medium':
      return 'Střední';
    case 'hard':
      return 'Těžká';
  }
}
