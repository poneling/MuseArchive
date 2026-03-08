import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';

interface PlayerProps {
  isPlaying: boolean;
  currentTrack?: {
    id: number;
    title: string;
    artist: string;
    album: string;
    duration: string;
    audioUrl?: string;
  };
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  progress: number;
  onSeek: (progress: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const Player: React.FC<PlayerProps> = ({
  isPlaying,
  currentTrack,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffle,
  onRepeat,
  progress: _progress,
  onSeek,
  volume,
  onVolumeChange,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // When track changes, reload audio and auto-play if isPlaying
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.load();

    if (isPlaying) {
      audio.play().catch(() => {});
    }

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) {
        onSeek((audio.currentTime / audio.duration) * 100);
      }
    };
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, x / rect.width));
    audio.currentTime = ratio * audio.duration;
    onSeek(ratio * 100);
  };

  const visualProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl ? encodeURI(`http://localhost:5222${currentTrack.audioUrl}`) : ''}
        onEnded={onNext}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 px-4 py-3 z-50">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-4 w-1/3">
            <div className="w-14 h-14 bg-gray-700 rounded flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm truncate">
                {currentTrack?.title || 'No track playing'}
              </h4>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack?.artist || 'Unknown artist'}
              </p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-2 w-1/3">
            <div className="flex items-center space-x-6">
              <button
                onClick={onShuffle}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button
                onClick={onPrevious}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={onPlayPause}
                className="bg-white text-black rounded-full p-3 hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-1" />
                )}
              </button>
              <button
                onClick={onNext}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                onClick={onRepeat}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2 w-full max-w-md">
              <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
              <div 
                className="flex-1 bg-gray-600 rounded-full h-1 cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="bg-white h-1 rounded-full relative group-hover:h-1.5 transition-all"
                  style={{ width: `${visualProgress}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {formatTime(duration || 0)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3 w-1/3 justify-end">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <div
              className="w-24 bg-gray-600 rounded-full h-1 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                onVolumeChange(Math.min(1, Math.max(0, x / rect.width)));
              }}
            >
              <div
                className="bg-white h-1 rounded-full"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;
