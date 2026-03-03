import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import type { Player, GameStartInfo, RoundEndInfo } from '../types/game';
import { Terminal, Trophy, Timer, Music, CheckCircle } from 'lucide-react';
import { stripTag } from '../utils/stringUtils';
import { getPlayerColor } from '../utils/playerColor';

interface GameProps {
  players: Player[];
  roomId: string;
  timeLeft: number;
  totalTime: number;
  currentVideoId: string;
  onAnswerSubmit: (answer: string) => void;
  onFetchRank: () => Promise<void>;
  playerIndex: number | null;
  gameStartInfo: GameStartInfo | null;
  roundEndInfo: RoundEndInfo | null;
  roundIndex: number;
  currentRound: number;
  totalRound: number;
  logs: string[];
}

const Game: React.FC<GameProps> = ({
  players,
  timeLeft,
  totalTime,
  currentVideoId,
  onAnswerSubmit,
  onFetchRank,
  playerIndex,
  gameStartInfo,
  roundEndInfo,
  roundIndex,
  currentRound,
  totalRound,
  logs,
}) => {
  const [answer, setAnswer] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  // 마운트 시 랭킹 초기 로드
  useEffect(() => {
    onFetchRank();
  }, []);

  // 채팅 로그 자동 스크롤
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 엔터키 → 입력창 포커스 (입력창에 포커스 없을 때만)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onAnswerSubmit(answer.trim());
      setAnswer('');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  /** 채팅 로그 "이름: 메시지" 파싱 → 이름에 색상 적용 */
  const renderChatLog = (log: string, i: number) => {
    if (log.startsWith('[시스템]') || log.startsWith('[오류]')) {
      return (
        <p key={i} className={log.startsWith('[오류]') ? 'text-red-400' : 'text-ums-secondary'}>
          {`> ${log}`}
        </p>
      );
    }
    const colonIdx = log.indexOf(':');
    if (colonIdx > 0) {
      const senderName = log.substring(0, colonIdx);
      const rest = log.substring(colonIdx);
      const player = players.find(p => stripTag(p.name) === senderName || p.name === senderName);
      const color = getPlayerColor(player?.colorIndex ?? null);
      return (
        <p key={i} className="text-white">
          {'> '}
          <span style={{ color }} className="font-bold">{senderName}</span>
          {rest}
        </p>
      );
    }
    return <p key={i} className="text-white">{`> ${log}`}</p>;
  };

  // 노래 정보 패널 내용 결정
  const renderSongPanel = () => {
    // 1) 라운드 종료: 정답 + 정답자 표시
    if (roundEndInfo) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 h-full">
          <CheckCircle size={40} className="text-ums-secondary" />
          <div className="text-center">
            <p className="text-[10px] text-ums-secondary uppercase tracking-widest mb-1">정답</p>
            <p className="text-2xl font-bold text-white tracking-wide">{roundEndInfo.answer}</p>
          </div>
          {roundEndInfo.winner && roundEndInfo.winner !== '없음' ? (
            <div className="text-center mt-2">
              <p className="text-[10px] text-ums-primary uppercase tracking-widest mb-1">정답자</p>
              <p className="text-lg font-bold text-ums-secondary">{stripTag(roundEndInfo.winner)}</p>
            </div>
          ) : (
            <p className="text-xs text-ums-primary/50 uppercase tracking-widest mt-2">정답자 없음</p>
          )}
        </div>
      );
    }

    // 2) 게임 시작 정보: ROUND_START 전 대기 중
    if (gameStartInfo) {
      return (
        <div className="flex flex-col items-center justify-center gap-5 h-full">
          <Music size={36} className="text-ums-accent animate-pulse" />
          <div className="text-center">
            <p className="text-lg font-bold text-ums-accent tracking-widest uppercase">{gameStartInfo.message}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mt-2">
            <div>
              <p className="text-[9px] text-ums-primary/60 uppercase tracking-widest">장르</p>
              <p className="text-sm font-bold text-ums-primary">{gameStartInfo.category}</p>
            </div>
            <div>
              <p className="text-[9px] text-ums-primary/60 uppercase tracking-widest">총 곡수</p>
              <p className="text-sm font-bold text-ums-primary">{gameStartInfo.songCount}곡</p>
            </div>
            <div>
              <p className="text-[9px] text-ums-primary/60 uppercase tracking-widest">모드</p>
              <p className="text-sm font-bold text-ums-primary">{gameStartInfo.gameType}</p>
            </div>
          </div>
        </div>
      );
    }

    // 3) 라운드 진행 쉄 (글자 없이 라운드 번호만)
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-full">
        {roundIndex > 0 && (
          <p className="text-ums-primary/40 text-sm font-mono tracking-widest">#{roundIndex}</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl h-[92vh] flex flex-row gap-3">

      {/* ── 좌측: 랭킹 패널 ── */}
      <div className="w-52 shrink-0 ums-panel flex flex-col gap-2 overflow-hidden bg-black">
        <div className="flex items-center gap-2 border-b-2 border-ums-primary pb-2 shrink-0">
          <Trophy size={16} className="text-ums-secondary" />
          <h2 className="text-xs font-bold text-ums-primary uppercase tracking-widest">랭킹</h2>
          {playerIndex !== null && (
            <span className="ml-auto text-[9px] text-ums-secondary font-mono">#{playerIndex}</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {sortedPlayers.map((p, idx) => {
            const color = getPlayerColor(p.colorIndex ?? null);
            return (
              <div
                key={p.id}
                className={`flex justify-between items-center px-2 py-1 border-l-2 text-xs
                  ${idx === 0
                    ? 'border-ums-secondary bg-ums-secondary/5'
                    : 'border-ums-primary/30'
                  }`}
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] font-bold shrink-0" style={{ color }}>
                    #{idx + 1}
                  </span>
                  <span className="font-bold truncate uppercase text-[11px]" style={{ color }}>
                    {stripTag(p.name)}
                  </span>
                </div>
                <span className="font-bold ml-2 shrink-0 text-[11px]" style={{ color }}>{p.score}</span>
              </div>
            );
          })}
          {sortedPlayers.length === 0 && (
            <p className="text-ums-primary/30 text-[9px] uppercase tracking-widest italic px-2">대기 중...</p>
          )}
        </div>
      </div>

      {/* ── 우측: 수직 스택 ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* 타이머 게이지 */}
        <div className="w-full ums-panel flex flex-col gap-2 p-2 shrink-0">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2 text-ums-primary">
              <Timer size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">남은 시간: {timeLeft}초</span>
            </div>
            <span className="text-[10px] text-ums-secondary uppercase">상태: 진행 중</span>
          </div>
          <div className="w-full h-3 bg-black border-2 border-ums-primary overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${progressPercent < 30 ? 'bg-red-500' : 'bg-ums-primary'
                }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 노래 정보 패널 (큰 공지 영역) */}
        <div className="ums-panel relative flex flex-col bg-black border-ums-accent shadow-[6px_6px_0px_0px_rgba(255,0,255,0.2)] overflow-hidden"
          style={{ minHeight: '28%', maxHeight: '35%' }}>
          <div className="flex items-center gap-2 border-b-2 border-ums-accent pb-2 mb-2 shrink-0">
            <Music size={14} className="text-ums-accent" />
            <span className="text-[10px] text-ums-accent font-bold uppercase tracking-widest">노래 정보</span>
          </div>
          <div className="flex-1 relative">
            {renderSongPanel()}
          </div>
          {/* YouTube 오디오 — display:none 대신 크기/투명도로 숨김 (autoplay 차단 방지) */}
          <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <YouTube
              key={currentVideoId}
              videoId={currentVideoId}
              opts={{ height: '1', width: '1', playerVars: { autoplay: 1, controls: 0, mute: 0, origin: window.location.origin, host: 'https://www.youtube.com' } }}
              onReady={(e) => { e.target.playVideo(); }}
            />
          </div>
          {/* 패널 최하단 — 라운드 번호 항상 표시 */}
          {currentRound > 0 && (
            <div className="shrink-0 flex justify-end pt-1 border-t border-ums-accent/20 mt-1">
              <span className="text-[9px] font-mono text-ums-accent/50 tracking-widest uppercase">
                ROUND {currentRound} / {totalRound}
              </span>
            </div>
          )}
        </div>

        {/* 채팅 로그 */}
        <div className="flex-1 ums-panel flex flex-col gap-2 overflow-hidden bg-black min-h-0">
          <div className="flex items-center gap-2 border-b-2 border-ums-primary pb-2 shrink-0">
            <Terminal size={14} className="text-ums-primary" />
            <span className="text-[10px] text-ums-primary font-bold uppercase tracking-widest">채팅 로그</span>
          </div>
          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto flex flex-col gap-1 text-[11px] font-mono"
          >
            {logs.map((log, i) => renderChatLog(log, i))}
            {logs.length === 0 && (
              <p className="text-ums-primary/30 italic uppercase tracking-widest text-[9px]">
                대화를 시작해보세요...
              </p>
            )}
          </div>

          {/* 채팅 입력바 */}
          <form onSubmit={handleSubmit} className="flex gap-3 shrink-0">
            <input
              ref={inputRef}
              type="text"
              className="ums-input flex-1 py-2 text-sm"
              placeholder="정답을 입력하세요... (Enter로 포커스)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button type="submit" className="ums-button px-8 shrink-0">전송</button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Game;
