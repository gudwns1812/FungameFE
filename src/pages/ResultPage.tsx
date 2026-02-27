import Result from '../components/Result';
import type { Player } from '../types/game';

interface ResultPageProps {
  rankings: Player[];
  onBackToLobby: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ rankings, onBackToLobby }) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Result rankings={rankings} onBackToLobby={onBackToLobby} />
    </div>
  );
};

export default ResultPage;

