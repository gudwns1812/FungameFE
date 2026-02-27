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
    sendMessage,
    fetchRooms,
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
                  timeLeft={timeLeft}
                  totalTime={totalTime}
                  currentVideoId={currentVideoId}
                  logs={logs}
                  onAnswerSubmit={handleAnswerSubmit}
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
