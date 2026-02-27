import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Player, GameStatus, GameEvent, Room } from '../types/game';

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8080';

export const useGameLogic = () => {
  const [status, setStatus] = useState<GameStatus>('LOBBY');
  const [nickname, setNickname] = useState(() => localStorage.getItem('ums_nickname') || '');
  const [players, setPlayers] = useState<Player[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(30);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentVideoId] = useState('dQw4w9WgXcQ'); // Placeholder
  const [isHost, setIsHost] = useState(false);

  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    if (nickname && status === 'LOBBY') {
      setStatus('ROOM_LIST');
    }
  }, [nickname, status]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-49), msg]);
  }, []);

  const handleEvent = useCallback((event: GameEvent) => {
    switch (event.type) {
      case 'PLAYER_JOIN':
        setPlayers(prev => {
          if (prev.find(p => p.name === event.nickname)) return prev;
          return [...prev, { id: event.nickname, name: event.nickname, isHost: false, score: 0 }];
        });
        addLog(`[시스템] ${event.nickname}님이 입장하셨습니다.`);
        break;
      case 'PLAYER_LEAVE':
        setPlayers(prev => prev.filter(p => p.name !== event.nickname));
        addLog(`[시스템] ${event.nickname}님이 퇴장하셨습니다.`);
        break;
      case 'HOST_CHANGE':
        setPlayers(prev => prev.map(p => ({
          ...p,
          isHost: p.name === event.newHost
        })));
        setIsHost(event.newHost === nickname);
        addLog(`[시스템] 방장이 ${event.newHost}님으로 변경되었습니다.`);
        break;
      case 'CHAT':
        addLog(`${event.nickname}: ${event.message}`);
        break;
      case 'GAME_START':
        setStatus('PLAYING');
        addLog(`[시스템] 게임이 시작되었습니다! (총 ${event.songCount}곡)`);
        break;
      case 'TIMER_TICK':
        setTimeLeft(event.remainingSeconds);
        setTotalTime(30); // Default round time
        break;
      case 'CORRECT_ANSWER':
        setPlayers(prev => prev.map(p => 
          p.name === event.nickname ? { ...p, score: event.score } : p
        ));
        addLog(`[시스템] ${event.nickname}님이 정답을 맞혔습니다! 정답: ${event.answer}`);
        break;
      case 'ROUND_TIMEOUT':
        addLog(`[시스템] 라운드가 종료되었습니다. 다음 곡(${event.nextSongIndex + 1})을 준비합니다.`);
        break;
      case 'GAME_END':
        setStatus('RESULT');
        const finalRankings: Player[] = Object.entries(event.rankings).map(([name, score]) => ({
          id: name,
          name,
          score,
          isHost: false // Final screen doesn't strictly need isHost
        }));
        setPlayers(finalRankings);
        addLog('[시스템] 게임이 종료되었습니다.');
        break;
    }
  }, [addLog, nickname]);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await axios.get('/game/rooms');
      if (response.data && response.data.result === 'SUCCESS') {
        const mappedRooms: Room[] = response.data.data.map((r: any) => ({
          id: r.roomId,
          name: r.title,
          hostName: r.hostName,
          playerCount: r.currentPlayers,
          maxPlayers: r.maxPlayers
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

  const connectWebSocket = useCallback((targetRoomId: string) => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-quiz'),
      reconnectDelay: 5000,
      onConnect: () => {
        addLog('[시스템] 서버 연결 성공.');
        client.subscribe(`/subscribe/room/${targetRoomId}`, (message) => {
          const event: GameEvent = JSON.parse(message.body);
          handleEvent(event);
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

  const enterLobby = useCallback((name: string) => {
    localStorage.setItem('ums_nickname', name);
    setNickname(name);
    setStatus('ROOM_LIST');
    addLog(`[시스템] ${name}님, 시스템에 접속하였습니다.`);
  }, [addLog]);

  const joinRoom = useCallback(async (room: Room) => {
    try {
      const response = await axios.post(`/game/rooms/${room.id}/join`, null, {
        headers: { nickname }
      });
      if (response.data.result === 'SUCCESS') {
        setRoomId(room.id);
        setIsHost(room.hostName === nickname);
        setStatus('WAITING');
        setPlayers([{ id: nickname, name: nickname, isHost: room.hostName === nickname, score: 0 }]);
        connectWebSocket(room.id);
        addLog(`[시스템] ${room.name} 방에 입장했습니다.`);
      }
    } catch (error) {
      console.error('Join room failed:', error);
      addLog('[오류] 방 입장에 실패했습니다.');
    }
  }, [nickname, addLog, connectWebSocket]);

  const createRoom = useCallback(async (title: string, maxPlayers: number, category: string) => {
    try {
      const response = await axios.post('/game/rooms', {
        title,
        maxPlayers,
        hostName: nickname,
        category
      });
      if (response.data.result === 'SUCCESS') {
        const newRoomId = response.data.data;
        setRoomId(newRoomId);
        setIsHost(true);
        setStatus('WAITING');
        setPlayers([{ id: nickname, name: nickname, isHost: true, score: 0 }]);
        connectWebSocket(newRoomId);
        addLog(`[시스템] 방을 생성했습니다: ${title}`);
      }
    } catch (error) {
      console.error('Create room failed:', error);
      addLog('[오류] 방 생성에 실패했습니다.');
    }
  }, [nickname, addLog, connectWebSocket]);

  const leaveRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      await axios.post(`/game/rooms/${roomId}/leave`, null, {
        headers: { nickname }
      });
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
      setRoomId(null);
      setStatus('ROOM_LIST');
      addLog('[시스템] 방에서 퇴장했습니다.');
    } catch (error) {
      console.error('Leave room failed:', error);
    }
  }, [roomId, nickname, addLog]);

  const startGame = useCallback(async () => {
    if (!roomId || !isHost) return;
    try {
      const response = await axios.post(`/game/rooms/${roomId}/start`, null, {
        headers: { nickname }
      });
      if (response.data.result === 'SUCCESS') {
        addLog('[시스템] 게임 시작 신호를 보냈습니다.');
      }
    } catch (error) {
      console.error('Start game failed:', error);
      addLog('[오류] 게임 시작에 실패했습니다.');
    }
  }, [roomId, isHost, nickname, addLog]);

  const sendMessage = useCallback((message: string) => {
    if (!roomId || !stompClient.current || !stompClient.current.connected) return;
    stompClient.current.publish({
      destination: `/publish/room/${roomId}/chat`,
      headers: { nickname },
      body: message
    });
  }, [roomId, nickname]);

  return {
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
    setStatus,
    addLog
  };
};
