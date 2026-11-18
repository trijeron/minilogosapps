export type LearningTaskType = 'match' | 'fill' | 'choice';

export interface MatchPair {
  left: string;
  right: string;
}

export interface MatchLearningTask {
  type: 'match';
  prompt: string;
  pairs: MatchPair[];
}

export interface FillLearningTask {
  type: 'fill';
  prompt: string;
  answer: string;
  answers?: string[];
  hint?: string;
}

export interface ChoiceLearningTask {
  type: 'choice';
  prompt: string;
  options: string[];
  correctIndex: number;
}

export type LearningTask = MatchLearningTask | FillLearningTask | ChoiceLearningTask;

export interface LearningGateSettings {
  enabled: boolean;
  triggerByGames: boolean;
  gamesLimit: number;
  triggerByMinutes: boolean;
  minutesLimit: number;
  tasksPerBreak: number;
  customJson: string;
}

export interface LearningGateProgress {
  gamesSinceLastGate: number;
  secondsSinceLastGate: number;
  gatePending: boolean;
  taskCursor: number;
}

export interface LearningTaskHistoryEntry {
  id: string;
  name: string;
  json: string;
  taskCount: number;
  typesSummary: string;
  savedAt: number;
}

