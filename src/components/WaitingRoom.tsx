import React, { useState, useEffect, useRef } from 'react';
import type { Player } from '../types/game';
import { User, Crown } from 'lucide-react';
import { stripTag } from '../utils/stringUtils';

interface WaitingRoomProps {
  players: Player[];
  onStart: () => void;
  onLeave: () => void;
  isHost: boolean;
  logs: string[];
  onSendMessage: (message: string) => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ players, onStart, onLeave, isHost, logs, onSendMessage }) => {
  const [chatInput, setChatInput] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const SLOTS = 8;
  const slotsArray = Array.from({ length: SLOTS }, (_, i) => players[i] || null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <div className="w-full max-w-4xl ums-panel">
      <div className="flex justify-between items-end border-b-4 border-ums-primary pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase italic">대기실</h1>
          <p className="text-xs text-ums-secondary uppercase">준비 완료: {players.length} / {SLOTS}</p>
        </div>
        <div className="flex gap-4">
          <button className="ums-button-secondary" onClick={onLeave}>
            나가기
          </button>
          {isHost && (
            <button className="ums-button" onClick={onStart}>
              게임 시작
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {slotsArray.map((player, index) => (
          <div
            key={index}
            className={`flex flex-col items-center gap-2 p-4 border-4 ${player ? 'border-ums-primary bg-ums-primary/10' : 'border-ums-primary/20 bg-black/50 border-dashed text-ums-primary/30'
              }`}
          >
            <div className={`p-2 border-2 ${player ? 'border-ums-primary text-ums-primary' : 'border-ums-primary/20'}`}>
              <User size={32} />
            </div>

            <div className="text-center overflow-hidden w-full">
              <span className={`font-bold block truncate text-xs ${player?.isHost ? 'text-ums-secondary' : ''}`}>
                {player ? stripTag(player.name) : '비어있음'}
              </span>
              {player?.isHost && <div className="text-[10px] text-ums-secondary flex items-center justify-center gap-1 mt-1"><Crown size={10} /> 방장</div>}
            </div>

            <span className="text-[10px] opacity-30 font-mono mt-auto">SLOT_{index + 1}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b-2 border-ums-primary pb-2">
          <span className="text-[10px] text-ums-primary font-bold uppercase tracking-widest">채팅 로그</span>
        </div>
        <div
          ref={logContainerRef}
          className="h-32 overflow-y-auto flex flex-col gap-1 text-[11px] font-mono bg-black/50 p-2 border-2 border-ums-primary/30"
        >
          {logs.map((log, i) => (
            <p key={i} className={`${log.startsWith('[시스템]') ? 'text-ums-secondary' : 'text-white'}`}>
              {`> ${log}`}
            </p>
          ))}
          {logs.length === 0 && <p className="text-ums-primary/30 italic uppercase tracking-widest text-[9px]">대화를 시작해보세요...</p>}
        </div>
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            className="ums-input flex-1 py-1 text-sm"
            placeholder="메시지를 입력하세요..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit" className="ums-button px-4 py-1 text-sm uppercase font-bold">전송</button>
        </form>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] text-ums-secondary animate-pulse tracking-[0.2em] uppercase italic">
          신호를 기다리는 중...
        </p>
      </div>
    </div>
  );
};

export default WaitingRoom;
