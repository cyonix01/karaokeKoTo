import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Tv, Smartphone, Music2 } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');

  const joinRemote = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/remote/${roomCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.6)] mx-auto">
            <Music2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">KARAOKE<span className="text-rose-500 font-black">HUB</span></h1>
          <p className="text-neutral-400 text-lg">
            Choose your device to get started
          </p>
        </div>

        <div className="grid gap-4 mt-8">
          <button
            onClick={() => navigate('/host')}
            className="group relative flex items-center p-6 bg-neutral-900 border border-neutral-800 rounded-3xl hover:bg-neutral-800 hover:border-rose-500/50 transition-all text-left shadow-xl"
          >
            <div className="bg-rose-500/10 p-4 rounded-xl group-hover:bg-rose-500/20 transition-colors">
              <Tv className="w-6 h-6 text-rose-500" />
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-semibold text-white mb-1">Start Host Screen</h3>
              <p className="text-neutral-400 text-sm">Open this on your TV or Laptop to play videos</p>
            </div>
          </button>

          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-neutral-800 p-4 rounded-xl">
                <Smartphone className="w-6 h-6 text-neutral-400" />
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-semibold text-white mb-1">Join as Remote</h3>
                <p className="text-neutral-400 text-sm">Control the queue from your phone</p>
              </div>
            </div>
            
            <form onSubmit={joinRemote} className="flex gap-3 pt-2">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent uppercase"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={!roomCode.trim()}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
