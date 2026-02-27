import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import type { Player } from '../types/game';
import { Terminal, Trophy, Timer } from 'lucide-react';

interface GameProps {
  players: Player[];
  timeLeft: number;
  totalTime: number;
  currentVideoId: string;
  onAnswerSubmit: (answer: string) => void;
  logs: string[];
}

const Game: React.FC<GameProps> = ({ players, timeLeft, totalTime, currentVideoId, onAnswerSubmit, logs }) => {
  const [answer, setAnswer] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const progressPercent = (timeLeft / totalTime) * 100;

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onAnswerSubmit(answer.trim());
      setAnswer('');
    }
  };

  return (
    <div className="w-full max-w-6xl h-[85vh] flex flex-col gap-4">
      {/* Top Header - Timer Gauge */}
      <div className="w-full ums-panel flex flex-col gap-2 p-2">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-ums-primary">
            <Timer size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">남은 시간: {timeLeft}초</span>
          </div>
          <span className="text-[10px] text-ums-secondary uppercase">상태: 진행 중</span>
        </div>
        <div className="w-full h-4 bg-black border-2 border-ums-primary overflow-hidden relative">
          <div 
            className="h-full bg-ums-primary transition-all duration-1000 ease-linear" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Side - YouTube Player & Chat */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Audio Container (YouTube hidden) */}
          <div className="ums-panel flex flex-col items-center justify-center bg-black relative min-h-[120px] border-ums-accent shadow-[8px_8px_0px_0px_rgba(255,0,255,0.2)]">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
               <Terminal size={100} className="text-ums-accent" />
            </div>
            <p className="text-ums-accent animate-pulse text-sm font-bold tracking-[0.3em] uppercase italic">노래 분석 중...</p>
            <div className="hidden">
              <YouTube 
                videoId={currentVideoId} 
                opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0 } }} 
              />
            </div>
          </div>

          {/* Chat Logs */}
          <div className="flex-1 ums-panel flex flex-col gap-2 overflow-hidden bg-black">
             <div className="flex items-center gap-2 border-b-2 border-ums-primary pb-2 mb-1">
               <Terminal size={14} className="text-ums-primary" />
               <span className="text-[10px] text-ums-primary font-bold uppercase tracking-widest">로그</span>
             </div>
             <div 
               ref={logContainerRef}
               className="flex-1 overflow-y-auto flex flex-col gap-1 text-[11px] font-mono scrollbar-thin scrollbar-thumb-ums-primary"
             >
               {logs.map((log, i) => (
                 <p key={i} className={`${log.startsWith('[시스템]') ? 'text-ums-secondary' : 'text-white'}`}>
                   {`> ${log}`}
                 </p>
               ))}
             </div>
             <form onSubmit={handleSubmit} className="mt-2 flex gap-4">
               <input 
                 type="text" 
                 className="ums-input flex-1 py-2 text-sm" 
                 placeholder="정답 입력..."
                 value={answer}
                 onChange={(e) => setAnswer(e.target.value)}
               />
               <button type="submit" className="ums-button px-8">전송</button>
             </form>
          </div>
        </div>

        {/* Right Side - Scoreboard */}
        <div className="w-full md:w-64 ums-panel flex flex-col gap-4 overflow-hidden bg-black">
           <div className="flex items-center gap-2 border-b-2 border-ums-primary pb-2">
             <Trophy size={18} className="text-ums-secondary" />
             <h2 className="text-sm font-bold text-ums-primary uppercase tracking-widest">랭킹</h2>
           </div>
           <div className="flex-1 overflow-y-auto flex flex-col gap-2">
             {players.sort((a, b) => b.score - a.score).map((p, idx) => (
               <div key={p.id} className={`flex justify-between items-center p-2 border-2 ${idx === 0 ? 'border-ums-secondary text-ums-secondary' : 'border-ums-primary text-ums-primary'} bg-black`}>
                 <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold">#{idx + 1}</span>
                    <span className="text-[11px] font-bold truncate uppercase">{p.name}</span>
                 </div>
                 <span className="text-xs font-bold ml-2">{p.score}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
