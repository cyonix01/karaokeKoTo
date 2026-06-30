import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { RoomState, Song } from '../types';
import { Search, Loader2, Plus, Play, Music, LayoutList, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function RemoteScreen() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Omit<Song, 'id'>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'queue'>('search');
  
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!roomId) return;

    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join-room', roomId, (response: { success: boolean, state?: RoomState, error?: string }) => {
      if (response.success && response.state) {
        setRoomState(response.state);
      } else {
        setError(response.error || 'Failed to join room');
      }
    });

    newSocket.on('state-update', (state: RoomState) => {
      setRoomState(state);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.results) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  const addToQueue = (song: Omit<Song, 'id'>) => {
    if (socket && roomId) {
      socket.emit('add-song', { roomCode: roomId, song });
      setAddedAnimation(song.videoId);
      setTimeout(() => setAddedAnimation(null), 1500);
    }
  };

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans">
        <Music className="w-16 h-16 text-neutral-600 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">No Room Specified</h2>
        <p className="text-neutral-400 mb-8">Please scan a QR code or enter a room code.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-red-500 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
        <p className="text-red-400 mb-8">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-neutral-800 text-white px-8 py-3 rounded-xl font-medium"
        >
          Try Another Room
        </button>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-4" />
        <p className="text-neutral-400">Connecting to room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 pt-safe pb-4 px-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
            KARAOKE<span className="text-rose-500 font-black">HUB</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-mono font-bold bg-neutral-800 px-2 py-1 rounded-md">{roomId}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search YouTube for songs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveTab('search');
            }}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
          {isSearching && (
            <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-rose-500 animate-spin" />
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2 sticky top-[120px] bg-neutral-950/80 backdrop-blur z-10 pb-2">
        <button
          onClick={() => setActiveTab('search')}
          className={twMerge(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
            activeTab === 'search' 
              ? "bg-neutral-800 text-white" 
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <Search className="w-4 h-4" />
          Search
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={twMerge(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
            activeTab === 'queue' 
              ? "bg-neutral-800 text-white" 
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <LayoutList className="w-4 h-4" />
          Queue ({roomState.queue.length})
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-32">
        {activeTab === 'search' && (
          <div className="space-y-3">
            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-12 text-neutral-500">
                No results found for "{searchQuery}"
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-12 text-neutral-600 flex flex-col items-center space-y-3">
                <Music className="w-12 h-12 opacity-50" />
                <p>Search for a song to add to the queue</p>
              </div>
            )}

            {searchResults.map((song) => (
              <div key={song.videoId} className="flex gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm">
                <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-800 relative">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-white font-medium text-sm line-clamp-2 leading-snug">{song.title}</h4>
                  <p className="text-neutral-500 text-xs mt-1 truncate">{song.channelTitle}</p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => addToQueue(song)}
                    className={twMerge(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      addedAnimation === song.videoId
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 active:bg-neutral-600 border border-transparent"
                    )}
                  >
                    {addedAnimation === song.videoId ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="space-y-3">
            {roomState.queue.length === 0 ? (
              <div className="text-center py-12 text-neutral-600 flex flex-col items-center space-y-3">
                <LayoutList className="w-12 h-12 opacity-50" />
                <p>The queue is empty.</p>
                <button 
                  onClick={() => setActiveTab('search')}
                  className="text-rose-500 font-medium text-sm mt-2"
                >
                  Search for songs
                </button>
              </div>
            ) : (
              roomState.queue.map((song, index) => (
                <div key={song.id} className="flex gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 relative overflow-hidden shadow-sm">
                  <div className="w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-white font-medium text-sm line-clamp-1">{song.title}</h4>
                    <p className="text-neutral-500 text-xs mt-1">{song.channelTitle}</p>
                  </div>
                  <div className="flex items-center text-rose-500 font-bold text-sm px-2">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Now Playing Bar (Sticky Bottom) */}
      {roomState.currentSong && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800 z-30">
          <div className="max-w-md mx-auto">
            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Now Playing
            </p>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-neutral-800 animate-[spin_4s_linear_infinite]">
                <img src={roomState.currentSong.thumbnail} alt="cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm truncate">{roomState.currentSong.title}</h4>
                <p className="text-neutral-400 text-xs truncate">{roomState.currentSong.channelTitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
