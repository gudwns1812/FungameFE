import WaitingRoom from '../components/WaitingRoom';
import type { Player } from '../types/game';

interface WaitingRoomPageProps {
  players: Player[];
  logs: string[];
  isHost: boolean;
  onStart: () => void;
  onLeave: () => void;
  onSendMessage: (message: string) => void;
}

const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({
  players,
  logs,
  isHost,
  onStart,
  onLeave,
  onSendMessage,
}) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <WaitingRoom
        players={players}
        logs={logs}
        isHost={isHost}
        onStart={onStart}
        onLeave={onLeave}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default WaitingRoomPage;

