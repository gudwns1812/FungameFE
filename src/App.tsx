import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NicknamePage from './pages/NicknamePage';
import RoomListPage from './pages/RoomListPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';
import { useGameLogic } from './hooks/useGameLogic';

function App() {
  const {
    status,
    nickname,
    roomId,
    players,
    rooms,
    timeLeft,
    totalTime,
    logs,
    currentVideoId,
    isHost,
    playerIndex,
    gameStartInfo,
    roundEndInfo,
    roundIndex,
    currentRound,
    totalRound,
    isBootstrapping,
    enterLobby,
    joinRoom,
    createRoom,
    leaveRoom,
    startGame,
    sendMessage,
    fetchRooms,
    fetchRank,
    changeNickname,
  } = useGameLogic();

  const handleAnswerSubmit = (answer: string) => {
    sendMessage(answer);
  };

  const statusToPath = (s: typeof status) => {
    switch (s) {
      case 'LOBBY':
        return '/';
      case 'ROOM_LIST':
        return '/rooms';
      case 'WAITING':
        return '/waiting';
      case 'PLAYING':
        return '/game';
      case 'RESULT':
        return '/result';
      default:
        return '/';
    }
  };

  const currentPath = statusToPath(status);

  if (isBootstrapping) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 bg-black">
        <div className="w-8 h-8 border-4 border-ums-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-ums-primary text-xs font-mono uppercase tracking-widest animate-pulse">
          시스템 초기화 중...
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            status === 'LOBBY'
              ? <NicknamePage onEnter={enterLobby} />
              : <Navigate to={currentPath} replace />
          }
        />
        <Route
          path="/rooms"
          element={
            status === 'ROOM_LIST'
              ? (
                <RoomListPage
                  rooms={rooms}
                  nickname={nickname}
                  onJoinRoom={joinRoom}
                  onCreateRoom={createRoom}
                  onRefreshRooms={fetchRooms}
                  onChangeNickname={changeNickname}
                />
              )
              : <Navigate to={currentPath} replace />
          }
        />
        <Route
          path="/waiting"
          element={
            status === 'WAITING'
              ? (
                <WaitingRoomPage
                  players={players}
                  logs={logs}
                  isHost={isHost}
                  onStart={startGame}
                  onLeave={leaveRoom}
                  onSendMessage={sendMessage}
                />
              )
              : <Navigate to={currentPath} replace />
          }
        />
        <Route
          path="/game"
          element={
            status === 'PLAYING'
              ? (
                <GamePage
                  players={players}
                  roomId={roomId ?? ''}
                  timeLeft={timeLeft}
                  totalTime={totalTime}
                  currentVideoId={currentVideoId}
                  logs={logs}
                  onAnswerSubmit={handleAnswerSubmit}
                  onFetchRank={fetchRank}
                  playerIndex={playerIndex}
                  gameStartInfo={gameStartInfo}
                  roundEndInfo={roundEndInfo}
                  roundIndex={roundIndex}
                  currentRound={currentRound}
                  totalRound={totalRound}
                />
              )
              : <Navigate to={currentPath} replace />
          }
        />
        <Route
          path="/result"
          element={
            status === 'RESULT'
              ? (
                <ResultPage
                  rankings={players}
                  onBackToLobby={leaveRoom}
                />
              )
              : <Navigate to={currentPath} replace />
          }
        />
        <Route path="*" element={<Navigate to={currentPath} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
