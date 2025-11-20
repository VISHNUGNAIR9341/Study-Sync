import React, { useState, useRef } from 'react';
import { Music, Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

const FocusMusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef(null);

    // Embedded YouTube lo-fi/study music tracks (using embed URLs)
    const tracks = [
        { name: 'Lo-Fi Beats', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1' },
        { name: 'Study Music', url: 'https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&loop=1' },
        { name: 'Calm Piano', url: 'https://www.youtube.com/embed/lTRiuFIWV54?autoplay=1&loop=1' },
        { name: 'Nature Sounds', url: 'https://www.youtube.com/embed/eKFTSSKCzWA?autoplay=1&loop=1' },
    ];

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        setCurrentTrack((prev) => (prev + 1) % tracks.length);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-2xl shadow-sm border border-purple-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-purple-800">
                    <Music size={20} /> Focus Music
                </h3>
                <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-purple-200 rounded-lg transition-colors"
                >
                    {isMuted ? <VolumeX size={18} className="text-purple-600" /> : <Volume2 size={18} className="text-purple-600" />}
                </button>
            </div>

            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl mb-4">
                <p className="text-sm font-medium text-purple-900 mb-2">{tracks[currentTrack].name}</p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={togglePlay}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full hover:shadow-lg transition-all"
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                        onClick={nextTrack}
                        className="bg-purple-200 text-purple-700 p-3 rounded-full hover:bg-purple-300 transition-all"
                    >
                        <SkipForward size={20} />
                    </button>
                    <div className="flex-1">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full accent-purple-600"
                        />
                    </div>
                </div>
            </div>

            {isPlaying && (
                <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                        ref={audioRef}
                        width="100%"
                        height="100%"
                        src={`${tracks[currentTrack].url}&mute=${isMuted ? 1 : 0}`}
                        title={tracks[currentTrack].name}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                    />
                </div>
            )}

            <p className="text-xs text-purple-600 mt-3 text-center">
                Curated playlists to boost your focus
            </p>
        </div>
    );
};

export default FocusMusicPlayer;
