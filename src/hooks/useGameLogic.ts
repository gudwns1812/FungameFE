import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Player, GameStatus, GameEvent, Room, GameStartInfo, RoundEndInfo } from '../types/game';
import { stripTag } from '../utils/stringUtils';
import { PLAYER_COLOR_INDEX_KEY } from '../utils/playerColor';

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

export const useGameLogic = () => {
  const [nickname, setNickname] = useState(() => localStorage.getItem('ums_nickname') || '');
  const [roomId, setRoomId] = useState<string | null>(() => localStorage.getItem('ums_roomId'));
  const [status, setStatus] = useState<GameStatus>(() => {
    const savedStatus = localStorage.getItem('ums_status');
    const savedNickname = localStorage.getItem('ums_nickname');
    return (savedStatus as GameStatus) || (savedNickname ? 'ROOM_LIST' : 'LOBBY');
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(30);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState('dQw4w9WgXcQ');
  const [isHost, setIsHost] = useState(false);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [gameStartInfo, setGameStartInfo] = useState<GameStartInfo | null>(null);
  const [roundEndInfo, setRoundEndInfo] = useState<RoundEndInfo | null>(null);
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [totalRound, setTotalRound] = useState<number>(0);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [myColorIndex, setMyColorIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem(PLAYER_COLOR_INDEX_KEY);
    return saved !== null ? Number(saved) : null;
  });

  const stompClient = useRef<Client | null>(null);
  const fetchRankRef = useRef<() => Promise<void>>(async () => { });

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-49), msg]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const fetchRoomUsers = useCallback(
    async (targetRoomId: string) => {
      try {
        const response = await axios.get(`/game/rooms/${targetRoomId}/users`, {
          // HTTP 헤더는 ASCII(ISO-8859-1)만 허용되므로 한글 닉네임은 인코딩해서 전송
          headers: nickname ? { playerName: encodeURIComponent(nickname) } : undefined,
        });

        if (response.data?.result === 'SUCCESS' && response.data.data) {
          const players: string[] = response.data.data.players ?? [];
          const host: string = response.data.data.host ?? '';
          console.log('fetchRoomUsers:', { players, host });
          setPlayers(prev => {
            const prevMap = new Map(prev.map(p => [p.name, p]));
            return players.map((name, idx) => {
              const prevPlayer = prevMap.get(name);
              return {
                id: name,
                name,
                isHost: name === host,
                score: prevPlayer?.score ?? 0,
                colorIndex: idx, // 배열 순서 = 슬롯 번호
              };
            });
          });
          // 내 닉네임이 host와 같으면 isHost 동기화
          setIsHost(host === nickname);
        }
      } catch (error) {
        console.error('Failed to fetch room users:', error);
      }
    },
    [nickname],
  );

  const handleEvent = useCallback((event: GameEvent) => {
    console.log("handleEvent", event);
    switch (event.type) {
      case 'PLAYER_JOIN':
      case 'PLAYER_LEAVE':
        if (roomId) {
          if (event.player == nickname) {
            console.log("플레이어 이름이 같음");
            break;
          }
          // 다른 플레이어의 상태에 따라 로그 추가
          const action = event.type === 'PLAYER_JOIN' ? '입장' : '퇴장';
          addLog(`[시스템] ${stripTag(event.player)}님이 ${action}하셨습니다.`);

          console.log("PLAYER_JOIN or PLAYER_LEAVE", roomId);
          fetchRoomUsers(roomId);
        }
        break;

      case 'HOST_CHANGE':
        setPlayers(prev => prev.map(p => ({
          ...p,
          isHost: p.name === event.newHost
        })));
        setIsHost(event.newHost === nickname);
        break;

      case 'CHAT':
        addLog(`${stripTag(event.playerName)}: ${event.message}`);
        break;

      case 'GAME_START':
        // status는 PLAYING으로 바꾸지 않음 — ROUND_START에서 처리
        setGameStartInfo({
          gameType: event.gameType,
          category: event.category,
          songCount: event.songCount,
          message: event.message,
        });
        setLogs([]); // 채팅 로그 초기화
        break;

      case 'ROUND_START':
        setStatus('PLAYING');
        setCurrentVideoId(event.videoURL);
        setRoundEndInfo(null);
        setGameStartInfo(null);
        setRoundIndex(event.roundIndex);
        setCurrentRound(event.currentRound);
        setTotalRound(event.totalRound);
        setLogs([]);
        setPlayers(prev => {
          const idx = prev.findIndex(p => p.name === nickname);
          setPlayerIndex(idx !== -1 ? idx + 1 : null);
          return prev;
        });
        break;

      case 'TIMER_TICK':
        setTimeLeft(event.remainingSeconds);
        setTotalTime(30);
        break;

      case 'CORRECT_ANSWER':
        setPlayers(prev => prev.map(p =>
          p.name === event.playerName ? { ...p, score: event.score } : p
        ));

        break;

      case 'ROUND_END':
        setRoundEndInfo({ answer: event.answer, winner: event.winner });
        fetchRankRef.current();
        break;

      case 'GAME_RESULT': {
        setStatus('RESULT');
        setPlayerIndex(null);
        setGameStartInfo(null);
        setRoundEndInfo(null);
        setLogs([]);
        const finalRankings: Player[] = event.rankings
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => {
            const colonIdx = line.lastIndexOf(':');
            const name = line.substring(0, colonIdx).trim();
            const score = parseInt(line.substring(colonIdx + 1).trim(), 10) || 0;
            return { id: name, name, score, isHost: false };
          });
        setPlayers(finalRankings);
        break;
      }
    }
  }, [addLog, nickname, roomId, fetchRoomUsers]);

  const handleEventRef = useRef(handleEvent);

  useEffect(() => {
    handleEventRef.current = handleEvent;
  }, [handleEvent]);

  const connectWebSocket = useCallback((targetRoomId: string) => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/subscribe/room/${targetRoomId}`, (message) => {
          console.log('message', message);
          const event: GameEvent = JSON.parse(message.body);
          handleEventRef.current(event);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        addLog('[오류] 서버 통신 중 문제가 발생했습니다.');
      }
    });

    client.activate();
    stompClient.current = client;
  }, [addLog, handleEvent]);

  const leaveRoom = useCallback(async () => {
    if (roomId) {
      try {
        await axios.post(`/game/rooms/${roomId}/leave`, null, {
          headers: { playerName: encodeURIComponent(nickname) }
        });
      } catch (error) {
        console.error('Leave room failed (will still exit):', error);
      }
    }
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
    setRoomId(null);
    setStatus('ROOM_LIST');
    setPlayers([]);
    setIsHost(false);
    setPlayerIndex(null);
    setGameStartInfo(null);
    setRoundEndInfo(null);
    localStorage.removeItem(PLAYER_COLOR_INDEX_KEY);
    setMyColorIndex(null);
  }, [roomId, nickname, addLog]);

  const returnToLobby = useCallback(() => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
    setRoomId(null);
    setStatus('ROOM_LIST');
    setPlayers([]);
    setIsHost(false);
    setPlayerIndex(null);
    setGameStartInfo(null);
    setRoundEndInfo(null);
    localStorage.removeItem(PLAYER_COLOR_INDEX_KEY);
    setMyColorIndex(null);
  }, []);

  useEffect(() => {
    localStorage.setItem('ums_status', status);
    if (roomId) {
      localStorage.setItem('ums_roomId', roomId);
    } else {
      localStorage.removeItem('ums_roomId');
    }
  }, [status, roomId]);

  useEffect(() => {
    const bootstrap = async () => {
      if (status === 'WAITING' || status === 'PLAYING') {
        if (roomId) {
          if (status === 'PLAYING') {
            try {
              await axios.post(`/game/rooms/${roomId}/join`, null, {
                headers: { playerName: encodeURIComponent(nickname) }
              });
            } catch (error: any) {
              const status409 = error?.response?.status === 409;
              const redirectRoomId = error?.response?.data?.data?.redirectRoomId
                ?? error?.response?.data?.redirectRoomId;
              if (status409 && redirectRoomId) {
                // 이미 다른 방 게임 중 → 해당 방으로 이동
                console.log('409: redirecting to active room', redirectRoomId);
                setRoomId(redirectRoomId);
                setStatus('PLAYING');
                setIsBootstrapping(false);
                connectWebSocket(redirectRoomId);
                return;
              }
              // 기타 실패 → rooms로
              console.error('Re-join failed on PLAYING re-entry, redirecting to rooms.');
              setRoomId(null);
              setStatus('ROOM_LIST');
              setPlayers([]);
              setIsHost(false);
              setPlayerIndex(null);
              setGameStartInfo(null);
              setRoundEndInfo(null);
              setIsBootstrapping(false);
              return;
            }
          }
          // 검증 성공 또는 WAITING 상태
          connectWebSocket(roomId);
          if (nickname) {
            setPlayers(prev => {
              if (prev.length === 0) {
                return [{ id: nickname, name: nickname, isHost, score: 0 }];
              }
              return prev;
            });
          }
        } else {
          setStatus('ROOM_LIST');
        }
      }
      setIsBootstrapping(false);
    };
    bootstrap();
  }, []); // Run once on mount

  // WAITING 페이지 진입/새로고침 시: 서버에서 현재 방 유저 목록을 가져와 동기화
  useEffect(() => {
    if (status === 'WAITING' && roomId) {
      fetchRoomUsers(roomId);
    }
  }, [status, roomId, fetchRoomUsers]);

  useEffect(() => {
    const handlePopState = () => {
      // PLAYING 중에는 뒤로가기 무시 — 게임 중 이탈 방지 및 localStorage 유지
      if (status === 'WAITING' || status === 'RESULT') {
        leaveRoom();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [status, leaveRoom]);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await axios.get('/game/rooms');
      if (response.data && response.data.result === 'SUCCESS') {
        const mappedRooms: Room[] = response.data.data.map((r: any) => ({
          id: r.roomId,
          name: r.title,
          hostName: r.hostName,
          playerCount: r.currentPlayers,
          maxPlayers: r.maxPlayers,
          status: r.status || 'WAITING'
        }));
        setRooms(mappedRooms);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'ROOM_LIST') {
      fetchRooms();
    }
  }, [status, fetchRooms]);

  const enterLobby = useCallback((name: string) => {
    localStorage.setItem('ums_nickname', name);
    setNickname(name);
    setStatus('ROOM_LIST');
  }, []);

  const joinRoom = useCallback(async (room: Room) => {
    try {
      const response = await axios.post(`/game/rooms/${room.id}/join`, null, {
        headers: { playerName: encodeURIComponent(nickname) }
      });
      if (response.data.result === 'SUCCESS') {
        const slotIndex = typeof response.data.data === 'number' ? response.data.data : null;
        if (slotIndex !== null) {
          localStorage.setItem(PLAYER_COLOR_INDEX_KEY, String(slotIndex));
          setMyColorIndex(slotIndex);
        }
        clearLogs();
        setRoomId(room.id);
        setIsHost(room.hostName === nickname);
        setStatus('WAITING');
        setPlayers([{ id: nickname, name: nickname, isHost: room.hostName === nickname, score: 0, colorIndex: slotIndex ?? undefined }]);
        connectWebSocket(room.id);
        addLog(`[시스템] ${room.name} 방에 입장했습니다.`);
        window.history.pushState({ room: room.id }, '');
      } else if (response.data.result === 'FAIL') {
        const code = response.data?.error?.code;
        let message = '방에 입장할 수 없습니다. 잠시 후 다시 시도해주세요.';
        if (code === 'G001') message = '해당 방은 인원이 가득 찼습니다.';
        else if (code === 'G002') message = '해당 방을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.';
        else if (code === 'G006') message = '이미 게임이 진행 중인 방입니다.';
        addLog(`[오류] (${code ?? 'UNKNOWN'}) ${message}`);
        window.alert(message);
      }
    } catch (error: any) {
      console.error('Join room failed:', error);
      const httpStatus = error?.response?.status;
      const redirectRoomId = error?.response?.data?.data?.redirectRoomId
        ?? error?.response?.data?.redirectRoomId;
      if (httpStatus === 409 && redirectRoomId) {
        // 이미 게임 중인 방 → 해당 방으로 이동
        console.log('409: joining active room', redirectRoomId);
        setRoomId(redirectRoomId);
        setIsHost(false);
        setStatus('PLAYING');
        setPlayers([{ id: nickname, name: nickname, isHost: false, score: 0 }]);
        connectWebSocket(redirectRoomId);
        return;
      }
      const code = error?.response?.data?.error?.code;
      let message = '방에 입장할 수 없습니다. 잠시 후 다시 시도해주세요.';
      if (code === 'G001') message = '해당 방은 인원이 가득 찼습니다.';
      else if (code === 'G002') message = '해당 방을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.';
      else if (code === 'G006') message = '이미 게임이 진행 중인 방입니다.';
      window.alert(message);
    }
  }, [nickname, connectWebSocket, clearLogs]);

  const createRoom = useCallback(async (title: string, maxPlayers: number, category: string, songCount: number) => {
    setIsCreatingRoom(true);
    try {
      const response = await axios.post('/game/rooms', {
        title,
        maxPlayers,
        hostName: nickname,
        category,
        songCount
      });
      if (response.data.result === 'SUCCESS') {
        const newRoomId = response.data.data;
        localStorage.setItem(PLAYER_COLOR_INDEX_KEY, '0');
        setMyColorIndex(0);
        clearLogs();
        setRoomId(newRoomId);
        setIsHost(true);
        setStatus('WAITING');
        setPlayers([{ id: nickname, name: nickname, isHost: true, score: 0, colorIndex: 0 }]);
        connectWebSocket(newRoomId);
        window.history.pushState({ room: newRoomId }, '');
      }
    } catch (error) {
      console.error('Create room failed:', error);
      addLog('[오류] 방 생성에 실패했습니다.');
    } finally {
      setIsCreatingRoom(false);
    }
  }, [nickname, addLog, connectWebSocket, clearLogs]);

  const startGame = useCallback(async () => {
    if (!roomId || !isHost) return;
    try {
      const response = await axios.post(`/game/rooms/${roomId}/start`, null, {
        headers: { playerName: encodeURIComponent(nickname) }
      });
    } catch (error) {
      console.error('Start game failed:', error);
    }
  }, [roomId, isHost, nickname, addLog]);

  const fetchRank = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await axios.get(`/game/rooms/${roomId}/play/rank`, {
        headers: nickname ? { playerName: encodeURIComponent(nickname) } : undefined,
      });
      if (response.data?.result === 'SUCCESS' && Array.isArray(response.data.data)) {
        const rankData: { player: string; score: number }[] = response.data.data;
        setPlayers(prev => {
          const prevMap = new Map(prev.map(p => [p.name, p]));
          return rankData.map(({ player, score }) => ({
            id: player,
            name: player,
            isHost: prevMap.get(player)?.isHost ?? false,
            score,
          }));
        });
      }
    } catch (error) {
      console.error('Failed to fetch rank:', error);
      // 랝킹 조회 실패 시 로그만 남기고 게임 유지
      addLog('[오류] 랭킹 정보를 불러오지 못했습니다.');
    }
  }, [roomId, nickname, addLog]);

  // fetchRankRef 최신화 — handleEvent 내 ROUND_END에서 ref 통해 호출
  useEffect(() => {
    fetchRankRef.current = fetchRank;
  }, [fetchRank]);

  const changeNickname = useCallback((newName: string) => {
    localStorage.setItem('ums_nickname', newName);
    setNickname(newName);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!roomId || !stompClient.current || !stompClient.current.connected) return;
    stompClient.current.publish({
      destination: `/publish/room/${roomId}/chat`,
      headers: { playerName: nickname },
      body: message
    });
  }, [roomId, nickname]);

  return {
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
    isCreatingRoom,
    myColorIndex,
    enterLobby,
    joinRoom,
    createRoom,
    leaveRoom,
    returnToLobby,
    startGame,
    sendMessage,
    setStatus,
    addLog,
    clearLogs,
    changeNickname,
    fetchRooms,
    fetchRank,
  };
};
