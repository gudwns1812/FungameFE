export interface Player {
  id: string; // nickname as id for now as per API
  name: string;
  isHost: boolean;
  score: number;
}

export interface Room {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
}

export type GameEvent = 
  | { type: 'PLAYER_JOIN'; players: string[] }
  | { type: 'PLAYER_LEAVE'; players: string[] }
  | { type: 'HOST_CHANGE'; newHost: string }
  | { type: 'CHAT'; nickname: string; message: string }
  | { type: 'GAME_START'; songCount: number }
  | { type: 'TIMER_TICK'; remainingSeconds: number }
  | { type: 'CORRECT_ANSWER'; nickname: string; answer: string; score: number }
  | { type: 'ROUND_TIMEOUT'; nextSongIndex: number }
  | { type: 'GAME_END'; rankings: Record<string, number> };

export type GameStatus = 'LOBBY' | 'ROOM_LIST' | 'WAITING' | 'PLAYING' | 'RESULT';
