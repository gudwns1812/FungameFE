import NicknameEntry from '../components/NicknameEntry';

interface NicknamePageProps {
  onEnter: (nickname: string) => void;
}

const NicknamePage: React.FC<NicknamePageProps> = ({ onEnter }) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <NicknameEntry onEnter={onEnter} />
    </div>
  );
};

export default NicknamePage;

