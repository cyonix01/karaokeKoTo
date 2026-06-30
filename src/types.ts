export interface Song {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  reservedBy?: string;
}

export interface RoomState {
  queue: Song[];
  currentSong: Song | null;
}
