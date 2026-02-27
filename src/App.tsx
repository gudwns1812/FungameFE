import NicknameEntry from './components/NicknameEntry';
import RoomList from './components/RoomList';
import WaitingRoom from './components/WaitingRoom';
import Game from './components/Game';
import Result from './components/Result';
import { useGameLogic } from './hooks/useGameLogic';

function App() {
  const { 
    status, 
    nickname,
    players, 
    rooms,
    timeLeft, 
    totalTime, 
    logs, 
    currentVideoId, 
    isHost,
    enterLobby,
    joinRoom, 
    createRoom,
    leaveRoom,
    startGame,
    sendMessage
  } = useGameLogic();

  const handleBackToLobby = () => {
    leaveRoom();
  };

  const handleAnswerSubmit = (answer: string) => {
    sendMessage(answer);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      {status === 'LOBBY' && (
        <NicknameEntry onEnter={enterLobby} />
      )}

      {status === 'ROOM_LIST' && (
        <RoomList 
          rooms={rooms} 
          nickname={nickname}
          onJoinRoom={(room) => joinRoom(room)}
          onCreateRoom={(title, maxPlayers, category) => createRoom(title, maxPlayers, category)}
        />
      )}

      {status === 'WAITING' && (
        <WaitingRoom 
          players={players} 
          isHost={isHost} 
          onStart={startGame}
        />
      )}

      {status === 'PLAYING' && (
        <Game 
          players={players}
          timeLeft={timeLeft}
          totalTime={totalTime}
          currentVideoId={currentVideoId}
          onAnswerSubmit={handleAnswerSubmit}
          logs={logs}
        />
      )}

      {status === 'RESULT' && (
        <Result 
          rankings={players} 
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}

export default App;
