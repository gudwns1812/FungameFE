import Game from '../components/Game';
import type { Player } from '../types/game';

interface GamePageProps {
  players: Player[];
  timeLeft: number;
  totalTime: number;
  currentVideoId: string;
  logs: string[];
  onAnswerSubmit: (answer: string) => void;
}

const GamePage: React.FC<GamePageProps> = ({
  players,
  timeLeft,
  totalTime,
  currentVideoId,
  logs,
  onAnswerSubmit,
}) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Game
        players={players}
        timeLeft={timeLeft}
        totalTime={totalTime}
        currentVideoId={currentVideoId}
        logs={logs}
        onAnswerSubmit={onAnswerSubmit}
      />
    </div>
  );
};

export default GamePage;

