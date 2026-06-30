import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface Song {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface RoomState {
  queue: Song[];
  currentSong: Song | null;
}

const rooms: Record<string, RoomState> = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const PORT = 3000;

  // Search API
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBaWYzRuxvYfRtvPTcPniCYGo_U4rtQf4k';

  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
         res.status(400).json({ error: 'Query is required' });
         return;
      }
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' karaoke')}&type=video&maxResults=15&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!response.ok) {
        console.error('YouTube API error:', data);
        res.status(response.status).json({ error: 'Failed to search YouTube API' });
        return;
      }

      const videos = data.items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle
      }));
      
      res.json({ results: videos });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  });

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', (callback) => {
      let code;
      do {
        code = generateRoomCode();
      } while (rooms[code]);
      
      rooms[code] = { queue: [], currentSong: null };
      socket.join(code);
      console.log(`Room created: ${code}`);
      
      if (typeof callback === 'function') {
        callback({ roomCode: code, state: rooms[code] });
      }
    });

    socket.on('join-room', (roomCode: string, callback) => {
      const code = roomCode.toUpperCase();
      if (rooms[code]) {
        socket.join(code);
        if (typeof callback === 'function') {
          callback({ success: true, state: rooms[code] });
        }
      } else {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Room not found' });
        }
      }
    });

    socket.on('add-song', (data: { roomCode: string, song: Omit<Song, 'id'> }) => {
      const code = data.roomCode.toUpperCase();
      if (rooms[code]) {
        const newSong: Song = {
          ...data.song,
          id: Math.random().toString(36).substring(2, 10)
        };
        rooms[code].queue.push(newSong);
        
        // If nothing is playing, play immediately
        if (!rooms[code].currentSong && rooms[code].queue.length === 1) {
           rooms[code].currentSong = rooms[code].queue.shift() || null;
        }

        io.to(code).emit('state-update', rooms[code]);
      }
    });

    socket.on('next-song', (roomCode: string) => {
      const code = roomCode.toUpperCase();
      if (rooms[code]) {
        if (rooms[code].queue.length > 0) {
          rooms[code].currentSong = rooms[code].queue.shift() || null;
        } else {
          rooms[code].currentSong = null;
        }
        io.to(code).emit('state-update', rooms[code]);
      }
    });
    
    socket.on('remove-song', (data: { roomCode: string, songId: string }) => {
       const code = data.roomCode.toUpperCase();
       if (rooms[code]) {
          rooms[code].queue = rooms[code].queue.filter(s => s.id !== data.songId);
          io.to(code).emit('state-update', rooms[code]);
       }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
