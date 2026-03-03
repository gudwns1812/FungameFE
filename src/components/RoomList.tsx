import React, { useState } from 'react';
import type { Room } from '../types/game';
import { Plus, Users } from 'lucide-react';
import { stripTag } from '../utils/stringUtils';

interface RoomListProps {
  rooms: Room[];
  onJoinRoom: (room: Room) => void;
  onCreateRoom: (title: string, maxPlayers: number, category: string, songCount: number) => void;
  onRefreshRooms: () => void;
  onChangeNickname: (newName: string) => void;
  nickname: string;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onJoinRoom, onCreateRoom, onRefreshRooms, onChangeNickname, nickname }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [songCount, setSongCount] = useState(10);
  const [category, setCategory] = useState('KPOP');
  const [showNicknameEdit, setShowNicknameEdit] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  const categories = [
    { value: 'KPOP', label: 'K-POP' },
    { value: 'POP', label: '팝' },
    { value: 'BALLADE', label: '발라드' },
    { value: 'RAP', label: '랩/힙합' },
    { value: 'OST', label: 'OST' }
  ];

  const songCountOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6">
      {/* 닉네임 변경 모달 */}
      {showNicknameEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowNicknameEdit(false)}
        >
          <div
            className="ums-panel flex flex-col gap-4 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-ums-primary">닉네임 변경</p>
            <input
              autoFocus
              type="text"
              className="ums-input text-sm py-2 px-3"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nicknameInput.trim()) {
                  onChangeNickname(nicknameInput.trim());
                  setShowNicknameEdit(false);
                } else if (e.key === 'Escape') {
                  setShowNicknameEdit(false);
                }
              }}
              maxLength={16}
              placeholder="새 닉네임"
            />
            <div className="flex gap-2">
              <button
                className="ums-button flex-1"
                onClick={() => { if (nicknameInput.trim()) { onChangeNickname(nicknameInput.trim()); setShowNicknameEdit(false); } }}
              >확인</button>
              <button
                className="ums-button-secondary flex-1"
                onClick={() => setShowNicknameEdit(false)}
              >취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center ums-panel">
        <div>
          <h1 className="text-2xl font-bold uppercase italic">대기실 로비</h1>
          <button
            className="text-xs text-ums-secondary uppercase hover:text-ums-primary transition-colors text-left"
            onClick={() => { setNicknameInput(nickname); setShowNicknameEdit(true); }}
          >
            {stripTag(nickname)}님 ✏️
          </button>
        </div>
        <div className="flex gap-2">
          <button
            className="ums-button-secondary text-xs px-3 py-2"
            onClick={onRefreshRooms}
          >
            새로고침
          </button>
          <button
            className="ums-button flex items-center gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} /> 방 만들기
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="ums-panel border-ums-accent shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] flex flex-col gap-4">
          <h2 className="text-lg font-bold uppercase text-ums-accent border-b-2 border-ums-accent pb-2">새로운 방 생성</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-ums-accent">방 제목</label>
              <input
                className="ums-input border-ums-accent text-ums-accent"
                placeholder="방 제목..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-ums-accent">음악 카테고리</label>
              <select
                className="ums-input border-ums-accent text-ums-accent"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-black text-ums-primary">{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-ums-accent">최대 인원 (2-8)</label>
              <input
                type="number"
                min="2"
                max="8"
                className="ums-input border-ums-accent text-ums-accent"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 2)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-ums-accent">곡 수 선택</label>
              <select
                className="ums-input border-ums-accent text-ums-accent"
                value={songCount}
                onChange={(e) => setSongCount(parseInt(e.target.value))}
              >
                {songCountOptions.map(n => (
                  <option key={n} value={n} className="bg-black text-ums-primary">{n}곡</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-2">
            <button
              className="ums-button bg-ums-accent"
              onClick={() => {
                if (newRoomName.trim()) {
                  onCreateRoom(newRoomName.trim(), maxPlayers, category, songCount);
                  setShowCreate(false);
                  setNewRoomName('');
                }
              }}
            >
              생성
            </button>
            <button
              className="ums-button-secondary"
              onClick={() => setShowCreate(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length === 0 ? (
          <div className="col-span-full ums-panel text-center py-12 border-dashed opacity-50">
            <p className="uppercase tracking-widest text-sm">현재 생성된 방이 없습니다. 새로운 방을 만들어보세요.</p>
          </div>
        ) : (
          rooms.map(room => {
            const isPlaying = room.status === 'PLAYING';
            return (
              <div
                key={room.id}
                className={`retro-card flex flex-col gap-4 ${isPlaying ? 'opacity-60 grayscale cursor-not-allowed shadow-none' : ''}`}
                onClick={() => !isPlaying && onJoinRoom(room)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-xl font-bold uppercase truncate pr-2">{room.name}</h3>
                    {isPlaying && (
                      <span className="text-[10px] font-bold text-ums-secondary bg-black/50 px-1 w-fit">
                        게임 진행 중
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold bg-white text-black px-1 shrink-0">
                    <Users size={12} /> {room.playerCount}/{room.maxPlayers}
                  </div>
                </div>
                <div className="mt-auto border-t-2 border-ums-primary pt-2 flex justify-between items-center text-[10px] uppercase font-bold">
                  <span>방장: {stripTag(room.hostName)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RoomList;
