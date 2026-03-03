import React, { useState } from 'react';

interface NicknameEntryProps {
  onEnter: (nickname: string) => void;
}

const NicknameEntry: React.FC<NicknameEntryProps> = ({ onEnter }) => {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onEnter(nickname.trim());
    }
  };

  return (
    <div className="w-full max-w-md ums-panel flex flex-col gap-8 items-center py-12">
      <div className="text-center">
        <h1 className="text-4xl font-black text-ums-primary tracking-tighter uppercase italic mb-2">
          노래 맞추기
        </h1>
        <p className="text-xs text-ums-secondary uppercase tracking-widest">이름을 입력해주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase font-bold text-ums-primary">플레이어 닉네임</label>
          <input
            type="text"
            className="ums-input"
            placeholder="닉네임을 입력하세요..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="ums-button w-full mt-4"
          disabled={!nickname.trim()}
        >
          시스템 접속
        </button>
      </form>

      <div className="mt-4 text-[10px] text-ums-primary/50 animate-pulse">
        [연결 준비 완료]
      </div>
    </div>
  );
};

export default NicknameEntry;
