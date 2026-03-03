import Game from '../components/Game';
import type { Player, GameStartInfo, RoundEndInfo } from '../types/game';

interface GamePageProps {
  players: Player[];
  roomId: string;
  timeLeft: number;
  totalTime: number;
  currentVideoId: string;
  logs: string[];
  onAnswerSubmit: (answer: string) => void;
  onFetchRank: () => Promise<void>;
  playerIndex: number | null;
  gameStartInfo: GameStartInfo | null;
  roundEndInfo: RoundEndInfo | null;
  roundIndex: number;
  currentRound: number;
  totalRound: number;
}

const GamePage: React.FC<GamePageProps> = ({
  players,
  roomId,
  timeLeft,
  totalTime,
  currentVideoId,
  logs,
  onAnswerSubmit,
  onFetchRank,
  playerIndex,
  gameStartInfo,
  roundEndInfo,
  roundIndex,
  currentRound,
  totalRound,
}) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Game
        players={players}
        roomId={roomId}
        timeLeft={timeLeft}
        totalTime={totalTime}
        currentVideoId={currentVideoId}
        logs={logs}
        onAnswerSubmit={onAnswerSubmit}
        onFetchRank={onFetchRank}
        playerIndex={playerIndex}
        gameStartInfo={gameStartInfo}
        roundEndInfo={roundEndInfo}
        roundIndex={roundIndex}
        currentRound={currentRound}
        totalRound={totalRound}
      />
    </div>
  );
};

export default GamePage;
