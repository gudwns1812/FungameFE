import React from 'react';
import type { Player } from '../types/game';
import { Medal } from 'lucide-react';
import { stripTag } from '../utils/stringUtils';

interface ResultProps {
  rankings: Player[];
  onBackToLobby: () => void;
}

const Result: React.FC<ResultProps> = ({ rankings, onBackToLobby }) => {
  const sortedRankings = [...rankings].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-2xl ums-panel flex flex-col gap-8 items-center py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-ums-primary uppercase tracking-widest italic">미션 완료</h1>
        <p className="text-xs text-ums-secondary mt-2 uppercase tracking-widest">[ 최종 결과 통계 ]</p>
      </div>

      <div className="w-full flex flex-col gap-4">
        {sortedRankings.map((p, idx) => (
          <div
            key={p.id}
            className={`flex items-center justify-between p-4 border-4 ${idx === 0 ? 'border-ums-secondary bg-ums-secondary/10' : 'border-ums-primary bg-black'
              }`}
          >
            <div className="flex items-center gap-6">
              <div className="w-12 text-center font-bold text-2xl">
                {idx === 0 ? <Medal className="text-ums-secondary inline" size={32} /> : idx + 1}
              </div>
              <span className={`text-xl font-bold uppercase ${idx === 0 ? 'text-ums-secondary' : 'text-ums-primary'}`}>
                {stripTag(p.name)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-ums-primary/50 block uppercase font-bold">점수</span>
              <span className={`text-2xl font-black ${idx === 0 ? 'text-ums-secondary' : 'text-ums-primary'}`}>{p.score}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="ums-button w-full py-6 text-xl mt-4" onClick={onBackToLobby}>
        로비로 돌아가기
      </button>
    </div>
  );
};

export default Result;
