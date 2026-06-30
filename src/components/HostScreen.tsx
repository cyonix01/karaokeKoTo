import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import YouTube from 'react-youtube';
import QRCode from 'react-qr-code';
import { RoomState } from '../types';
import { QrCode, Monitor, Music2 } from 'lucide-react';

export default function HostScreen() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  useEffect(() => {
    // Determine the websocket URL based on current host
    const socketUrl = window.location.protocol === 'https:' 
      ? `wss://${window.location.host}` 
      : `ws://${window.location.host}`;
    
    // Fallback to socket.io default if needed, but relative usually works
    const newSocket = io(); 
    setSocket(newSocket);

    newSocket.emit('create-room', (response: { roomCode: string, state: RoomState }) => {
      setRoomCode(response.roomCode);
      setRoomState(response.state);
    });

    newSocket.on('state-update', (state: RoomState) => {
      setRoomState(state);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleEnd = () => {
    if (socket && roomCode) {
      socket.emit('next-song', roomCode);
    }
  };

  const remoteUrl = `${window.location.protocol}//${window.location.host}/remote/${roomCode}`;

  if (!roomCode || !roomState) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Monitor className="w-12 h-12 text-rose-500" />
          <p className="text-white text-lg font-medium">Initializing host screen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#050505] text-gray-100 font-sans overflow-hidden p-8 gap-8">
      {/* HOST SCREEN */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.5)]">
               <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">KARAOKE<span className="text-rose-500 font-black">HUB</span></h1>
              <p className="text-xs text-neutral-500 uppercase tracking-widest">created by Sir Ace Reyes</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-neutral-500 uppercase">Current Room</p>
              <p className="text-xl font-mono font-bold text-rose-500">{roomCode}</p>
            </div>
            <div className="h-12 w-[1px] bg-neutral-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium">Ready</span>
            </div>
          </div>
        </div>

        {/* Main Stage / Video Area */}
        <div className="relative flex-1 bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden group">
          {roomState.currentSong ? (
            <div className="w-full h-full relative z-0">
               <YouTube
                videoId={roomState.currentSong.videoId}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1
                  }
                }}
                onEnd={handleEnd}
                className="w-full h-full absolute inset-0"
              />
            </div>
          ) : (
             <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 z-20">
               <div className="text-center space-y-4">
                  <div className="w-32 h-32 border-4 border-rose-600 rounded-full border-t-transparent animate-spin mb-4 mx-auto"></div>
                  <p className="text-2xl font-serif italic text-neutral-400">Waiting for songs...</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR (QUEUE & PAIRING) */}
      <div className="w-[320px] flex flex-col gap-6">
        {/* Pairing Card */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-xl">
          <h3 className="text-sm font-bold uppercase text-neutral-500 mb-4 tracking-widest">Add Your Song</h3>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-white p-2 rounded-xl">
               <QRCode value={remoteUrl} size={100} style={{ width: "100%", height: "100%" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-400 leading-tight mb-2">Scan QR to open Remote Controller on your phone</p>
              <div className="text-lg font-mono font-bold text-white tracking-tighter break-all leading-tight">
                {window.location.host}/remote
              </div>
            </div>
          </div>
        </div>

        {/* The Queue */}
        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-sm font-bold uppercase text-rose-500 tracking-widest flex justify-between">
              <span>Coming Up Next</span>
              <span className="text-neutral-500 font-normal">{roomState.queue.length} Songs</span>
            </h3>
          </div>
          <div className="flex-1 px-2 py-2 space-y-2 overflow-y-auto scrollbar-hide">
             {roomState.queue.length === 0 ? (
               <div className="h-full flex items-center justify-center text-center p-4">
                  <p className="text-neutral-500 text-sm">Queue is empty</p>
               </div>
             ) : (
                roomState.queue.map((song, index) => (
                  <div key={song.id} className={`p-4 rounded-2xl ${index === 0 ? 'bg-neutral-800/40 border border-neutral-800' : 'bg-transparent border border-transparent hover:bg-neutral-800/20'} flex items-center gap-4 transition-colors`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${index === 0 ? 'bg-rose-500/20 text-rose-500' : 'bg-neutral-800 text-neutral-500'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-sm">{song.title}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {song.channelTitle}
                        {song.reservedBy && <span className="text-rose-400 ml-1">• {song.reservedBy}</span>}
                      </p>
                    </div>
                  </div>
                ))
             )}
          </div>
          
          {/* Footer Branding */}
          <div className="p-4 bg-neutral-950 border-t border-neutral-800 text-center">
             <p className="text-[10px] text-neutral-600 uppercase tracking-widest">please support my project</p>
          </div>
        </div>
      </div>
    </div>
  );
}
