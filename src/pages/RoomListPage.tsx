import RoomList from '../components/RoomList';
import type { Room } from '../types/game';

interface RoomListPageProps {
  rooms: Room[];
  nickname: string;
  onJoinRoom: (room: Room) => void;
  onCreateRoom: (title: string, maxPlayers: number, category: string, songCount: number) => void;
  onRefreshRooms: () => void;
  onChangeNickname: (newName: string) => void;
}

const RoomListPage: React.FC<RoomListPageProps> = ({
  rooms,
  nickname,
  onJoinRoom,
  onCreateRoom,
  onRefreshRooms,
  onChangeNickname,
}) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <RoomList
        rooms={rooms}
        nickname={nickname}
        onJoinRoom={onJoinRoom}
        onCreateRoom={onCreateRoom}
        onRefreshRooms={onRefreshRooms}
        onChangeNickname={onChangeNickname}
      />
    </div>
  );
};

export default RoomListPage;

