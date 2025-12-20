export interface ReputationScore {
  address: string;
  score: number;
  rank?: number;
  lastUpdate: number;
  actionCount?: number;
}

export interface ReputationAction {
  actor: string;
  target: string;
  actionType: number;
  weight: number;
  timestamp: number;
  txHash: string;
}

export interface LeaderboardEntry extends ReputationScore {
  rank: number;
  username?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalActions: number;
  highestScore: number;
  averageScore: number;
}

export interface StressTestConfig {
  actionCount: number;
  batchSize: number;
  targetAddresses?: string[];
}

export interface StressTestResults {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  duration: number;
  throughput: number;
  gasUsed: string;
  averageGasPerAction: number;
}

export type ActionType = 'FOLLOW' | 'LIKE' | 'BOOST' | 'VERIFY' | 'COMMENT' | 'SHARE' | 'REPORT';

export interface WebSocketMessage {
  type: 'REPUTATION_UPDATED' | 'ACTION_PERFORMED' | 'USER_REGISTERED' | 'STATS_UPDATED';
  data: any;
}
