import React from 'react';
import type { Player } from '../types/game';
import { User, Crown } from 'lucide-react';

interface WaitingRoomProps {
  players: Player[];
  onStart: () => void;
  isHost: boolean;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ players, onStart, isHost }) => {
  const SLOTS = 8;
  const slotsArray = Array.from({ length: SLOTS }, (_, i) => players[i] || null);

  return (
    <div className="w-full max-w-4xl ums-panel">
      <div className="flex justify-between items-end border-b-4 border-ums-primary pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase italic">대기실</h1>
          <p className="text-xs text-ums-secondary uppercase">준비 완료: {players.length} / {SLOTS}</p>
        </div>
        {isHost && (
          <button className="ums-button" onClick={onStart}>
            게임 시작
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {slotsArray.map((player, index) => (
          <div 
            key={index} 
            className={`flex flex-col items-center gap-2 p-4 border-4 ${
              player ? 'border-ums-primary bg-ums-primary/10' : 'border-ums-primary/20 bg-black/50 border-dashed text-ums-primary/30'
            }`}
          >
            <div className={`p-2 border-2 ${player ? 'border-ums-primary text-ums-primary' : 'border-ums-primary/20'}`}>
              <User size={32} />
            </div>
            
            <div className="text-center overflow-hidden w-full">
              <span className={`font-bold block truncate text-xs ${player?.isHost ? 'text-ums-secondary' : ''}`}>
                {player ? player.name : '비어있음'}
              </span>
              {player?.isHost && <div className="text-[10px] text-ums-secondary flex items-center justify-center gap-1 mt-1"><Crown size={10} /> 방장</div>}
            </div>
            
            <span className="text-[10px] opacity-30 font-mono mt-auto">SLOT_{index + 1}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
         <p className="text-[10px] text-ums-secondary animate-pulse tracking-[0.2em] uppercase italic">
           신호를 기다리는 중...
         </p>
      </div>
    </div>
  );
};

export default WaitingRoom;
