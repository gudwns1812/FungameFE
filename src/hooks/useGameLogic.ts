import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Player, GameStatus, GameEvent, Room } from '../types/game';

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8080';

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
  const [currentVideoId] = useState('dQw4w9WgXcQ'); // Placeholder
  const [isHost, setIsHost] = useState(false);

  const stompClient = useRef<Client | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-49), msg]);
  }, []);

  const fetchRoomUsers = useCallback(
    async (targetRoomId: string) => {
      try {
        const response = await axios.get(`/game/rooms/${targetRoomId}/users`, {
          // HTTP 헤더는 ASCII(ISO-8859-1)만 허용되므로 한글 닉네임은 인코딩해서 전송
          headers: nickname ? { nickname: encodeURIComponent(nickname) } : undefined,
        });

        if (response.data?.result === 'SUCCESS' && Array.isArray(response.data.data)) {
          console.log(response.data.data);
          const users: string[] = response.data.data;
          setPlayers(prev => {
            const prevMap = new Map(prev.map(p => [p.name, p]));
            return users.map(name => {
              const prevPlayer = prevMap.get(name);
              return {
                id: name,
                name,
                isHost: prevPlayer?.isHost ?? name === nickname ? isHost : false,
                score: prevPlayer?.score ?? 0,
              };
            });
          });
        }
      } catch (error) {
        console.error('Failed to fetch room users:', error);
      }
    },
    [nickname, addLog, isHost],
  );

  const handleEvent = useCallback((event: GameEvent) => {
    console.log("handleEvent" , event);
    switch (event.type) {
      case 'PLAYER_JOIN':
      case 'PLAYER_LEAVE':
        if (roomId) {
          // 서버에서 최신 유저 목록을 가져와 players만 동기화
          console.log("PLAYER_JOIN or PLAYER_LEAVE" , roomId);
          fetchRoomUsers(roomId);
        }
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
        addLog(`[시스템] 라운드가 종료되었습니다.`);
        break;
      case 'GAME_END':
        { setStatus('RESULT');
        const finalRankings: Player[] = Object.entries(event.rankings).map(([name, score]) => ({
          id: name,
          name,
          score,
          isHost: false // Final screen doesn't strictly need isHost
        }));
        setPlayers(finalRankings);
        addLog('[시스템] 게임이 종료되었습니다.');
        break; }
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
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-quiz'),
      reconnectDelay: 5000,
      onConnect: () => {
        addLog('[시스템] 서버 연결 성공.');
        client.subscribe(`/subscribe/room/${targetRoomId}`, (message) => {
          console.log('message' , message);
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
    if (!roomId) return;
    try {
      await axios.post(`/game/rooms/${roomId}/leave`, null, {
        headers: { nickname: encodeURIComponent(nickname) }
      });
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
      setRoomId(null);
      setStatus('ROOM_LIST');
      setPlayers([]);
      setIsHost(false);
      addLog('[시스템] 방에서 퇴장했습니다.');
    } catch (error) {
      console.error('Leave room failed:', error);
    }
  }, [roomId, nickname, addLog]);

  useEffect(() => {
    localStorage.setItem('ums_status', status);
    if (roomId) {
      localStorage.setItem('ums_roomId', roomId);
    } else {
      localStorage.removeItem('ums_roomId');
    }
  }, [status, roomId]);

  useEffect(() => {
    if (status === 'WAITING' || status === 'PLAYING') {
      if (roomId) {
        connectWebSocket(roomId);
        // If we are in WAITING/PLAYING, we should also ensure nickname is there
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
  }, []); // Run once on mount

  // WAITING 페이지 진입/새로고침 시: 서버에서 현재 방 유저 목록을 가져와 동기화
  useEffect(() => {
    if (status === 'WAITING' && roomId) {
      fetchRoomUsers(roomId);
    }
  }, [status, roomId, fetchRoomUsers]);

  useEffect(() => {
    const handlePopState = () => {
      if (status === 'WAITING' || status === 'PLAYING' || status === 'RESULT') {
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
    addLog(`[시스템] ${name}님, 시스템에 접속하였습니다.`);
  }, [addLog]);

  const joinRoom = useCallback(async (room: Room) => {
    try {
      const response = await axios.post(`/game/rooms/${room.id}/join`, null, {
        headers: { nickname: encodeURIComponent(nickname) }
      });
      if (response.data.result === 'SUCCESS') {
        setRoomId(room.id);
        setIsHost(room.hostName === nickname);
        setStatus('WAITING');
        setPlayers([{ id: nickname, name: nickname, isHost: room.hostName === nickname, score: 0 }]);
        connectWebSocket(room.id);
        addLog(`[시스템] ${room.name} 방에 입장했습니다.`);
        
        // Push state to handle back button
        window.history.pushState({ room: room.id }, '');
      } else if (response.data.result === 'FAIL') {
        const code = response.data?.error?.code;
        let message = '방에 입장할 수 없습니다. 잠시 후 다시 시도해주세요.';
        if (code === 'G001') {
          message = '해당 방은 인원이 가득 찼습니다.';
        } else if (code === 'G002') {
          message = '해당 방을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.';
        } else if (code === 'G006') {
          message = '이미 게임이 진행 중인 방입니다.';
        }
        addLog(`[오류] (${code ?? 'UNKNOWN'}) ${message}`);
        window.alert(message);
      }
    } catch (error: any) {
      console.error('Join room failed:', error);
      const code = error?.response?.data?.error?.code;
      let message = '방에 입장할 수 없습니다. 잠시 후 다시 시도해주세요.';
      if (code === 'G001') {
        message = '해당 방은 인원이 가득 찼습니다.';
      } else if (code === 'G002') {
        message = '해당 방을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.';
      } else if (code === 'G006') {
        message = '이미 게임이 진행 중인 방입니다.';
      }
      addLog(`[오류] (${code ?? 'UNKNOWN'}) ${message}`);
      window.alert(message);
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

        // Push state to handle back button
        window.history.pushState({ room: newRoomId }, '');
      }
    } catch (error) {
      console.error('Create room failed:', error);
      addLog('[오류] 방 생성에 실패했습니다.');
    }
  }, [nickname, addLog, connectWebSocket]);

  const startGame = useCallback(async () => {
    if (!roomId || !isHost) return;
    try {
      const response = await axios.post(`/game/rooms/${roomId}/start`, null, {
        headers: { nickname: encodeURIComponent(nickname) }
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
    addLog,
    fetchRooms,
  };
};
