import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

const MediaPlayer = ({ channel }) => {
    const socket = useSocket();
    const [url, setUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [isYTReady, setIsYTReady] = useState(false);
    const isInternalAction = useRef(false);

    // Extract YouTube video ID from URL
    const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const isYouTube = url && (url.includes('youtube.com') || url.includes('youtu.be'));
    const youtubeId = isYouTube ? getYouTubeId(url) : null;

    // Load YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
            setIsYTReady(true);
        };

        if (window.YT && window.YT.Player) {
            setIsYTReady(true);
        }
    }, []);

    // Initialize YouTube player
    useEffect(() => {
        if (!isYTReady || !youtubeId || !isYouTube) return;

        if (playerRef.current) {
            playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player('youtube-player', {
            videoId: youtubeId,
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0
            },
            events: {
                onStateChange: (event) => {
                    if (isInternalAction.current) return;

                    const currentTime = playerRef.current.getCurrentTime();
                    if (event.data === window.YT.PlayerState.PLAYING) {
                        socket?.emit('media_action', {
                            room: channel,
                            type: 'play',
                            payload: currentTime
                        });
                    } else if (event.data === window.YT.PlayerState.PAUSED) {
                        socket?.emit('media_action', {
                            room: channel,
                            type: 'pause',
                            payload: currentTime
                        });
                    }
                }
            }
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, [isYTReady, youtubeId, isYouTube, channel, socket]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('request_media_state', channel);

        socket.on('get_current_state', ({ requesterId }) => {
            let currentTime = 0;
            let playing = false;

            if (isYouTube && playerRef.current) {
                currentTime = playerRef.current.getCurrentTime();
                playing = playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING;
            } else if (videoRef.current) {
                currentTime = videoRef.current.currentTime;
                playing = !videoRef.current.paused;
            }

            socket.emit('send_media_state', {
                to: requesterId,
                state: {
                    url,
                    currentTime,
                    isPlaying: playing
                }
            });
        });

        socket.on('media_update', (data) => {
            console.log('Media update received:', data);
            isInternalAction.current = true;

            const handlePlay = (time) => {
                setIsPlaying(true);
                if (isYouTube && playerRef.current && playerRef.current.playVideo) {
                    if (time !== undefined) playerRef.current.seekTo(time, true);
                    playerRef.current.playVideo();
                } else if (videoRef.current) {
                    if (time !== undefined) videoRef.current.currentTime = time;
                    videoRef.current.play();
                }
            };

            const handlePause = (time) => {
                setIsPlaying(false);
                if (isYouTube && playerRef.current && playerRef.current.pauseVideo) {
                    if (time !== undefined) playerRef.current.seekTo(time, true);
                    playerRef.current.pauseVideo();
                } else if (videoRef.current) {
                    if (time !== undefined) videoRef.current.currentTime = time;
                    videoRef.current.pause();
                }
            };

            switch (data.type) {
                case 'url':
                    setUrl(data.payload);
                    break;
                case 'play':
                    handlePlay(data.payload);
                    break;
                case 'pause':
                    handlePause(data.payload);
                    break;
                case 'seek':
                    if (isYouTube && playerRef.current && playerRef.current.seekTo) {
                        playerRef.current.seekTo(data.payload, true);
                    } else if (videoRef.current) {
                        videoRef.current.currentTime = data.payload;
                    }
                    break;
                case 'sync':
                    setUrl(data.payload.url);
                    if (data.payload.isPlaying) {
                        handlePlay(data.payload.currentTime);
                    } else {
                        handlePause(data.payload.currentTime);
                    }
                    break;
                default: break;
            }

            setTimeout(() => {
                isInternalAction.current = false;
            }, 500);
        });

        return () => {
            socket.off('media_update');
            socket.off('get_current_state');
        };
    }, [socket, channel, isYouTube, url]);

    const handleUrlSubmit = (inputUrl) => {
        setUrl(inputUrl);
        if (socket) {
            socket.emit('media_action', { room: channel, type: 'url', payload: inputUrl });
        }
    };

    const handlePlay = () => {
        if (isInternalAction.current) return;
        const time = videoRef.current?.currentTime || 0;
        if (socket) socket.emit('media_action', { room: channel, type: 'play', payload: time });
    };

    const handlePause = () => {
        if (isInternalAction.current) return;
        const time = videoRef.current?.currentTime || 0;
        if (socket) socket.emit('media_action', { room: channel, type: 'pause', payload: time });
    };

    const handleSeek = (e) => {
        if (isInternalAction.current) return;
        if (socket) socket.emit('media_action', { room: channel, type: 'seek', payload: e.target.currentTime });
    };

    const handleClose = () => {
        setUrl('');
        if (socket) socket.emit('media_action', { room: channel, type: 'url', payload: '' });
    };

    if (!url) {
        return (
            <div className="media-placeholder">
                <div className="placeholder-content">
                    <div className="icon">🍿</div>
                    <h3>Start a Watch Party</h3>
                    <p>Paste a YouTube link or direct video URL (mp4/webm) to watch together!</p>
                    <div className="input-box">
                        <span className="link-icon">🔗</span>
                        <input
                            type="text"
                            placeholder="https://youtube.com/watch?v=... or video.mp4"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    handleUrlSubmit(e.target.value.trim());
                                    e.target.value = '';
                                }
                            }}
                            className="media-input"
                        />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>💡 Anyone can change the video anytime</p>
                </div>
                <style>{`
                    .media-placeholder {
                        background: linear-gradient(135deg, #1e1e1e 0%, #252526 100%);
                        padding: 40px; text-align: center; border-bottom: 2px solid #333;
                        display: flex; justify-content: center; align-items: center;
                        box-shadow: inset 0 -20px 20px -20px rgba(0,0,0,0.5);
                    }
                    .placeholder-content {
                        max-width: 500px; animation: fadeIn 0.5s ease;
                    }
                    .icon { font-size: 3rem; margin-bottom: 10px; }
                    .media-placeholder h3 { margin-bottom: 10px; color: #fff; text-transform: uppercase; letter-spacing: 2px; }
                    .media-placeholder p { color: #888; margin-bottom: 20px; font-size: 0.9rem; }
                    .input-box {
                        display: flex; align-items: center; background: #333; border-radius: 50px;
                        padding: 5px 20px; border: 1px solid #444; transition: all 0.3s;
                    }
                    .input-box:focus-within { border-color: #007acc; box-shadow: 0 0 15px rgba(0,122,204,0.3); transform: scale(1.02); }
                    .link-icon { margin-right: 10px; opacity: 0.5; }
                    .media-input {
                        background: transparent; border: none; color: white; padding: 10px; width: 100%; outline: none; font-size: 1rem;
                    }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="media-player-container">
            <div className="cinema-glow"></div>
            <div className="player-header">
                <span className="live-badge">● LIVE SYNC</span>
                <span className="now-playing">
                    {isYouTube ? '▶️ YouTube' : url.split('/').pop()}
                </span>
                <button className="close-btn" onClick={handleClose}>✕ Close & Change Video</button>
            </div>

            <div className="video-wrapper">
                {isYouTube && youtubeId ? (
                    <div id="youtube-player" style={{ width: '100%', height: '100%' }}></div>
                ) : (
                    <video
                        ref={videoRef}
                        src={url}
                        controls
                        className="shared-video"
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeeked={handleSeek}
                        autoPlay
                    />
                )}
            </div>

            <style>{`
                .media-player-container {
                    background: #000; padding: 0; position: relative; overflow: hidden;
                    border-bottom: 2px solid #007acc; flex-shrink: 0;
                }
                .cinema-glow {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(circle at center, rgba(0,122,204,0.15) 0%, transparent 70%);
                    pointer-events: none; z-index: 0;
                }
                .player-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 10px 20px; background: rgba(0,0,0,0.8); position: relative; z-index: 2;
                    backdrop-filter: blur(5px); border-bottom: 1px solid #222;
                }
                .live-badge { color: #ff4444; font-weight: bold; font-size: 0.7rem; animation: pulse 2s infinite; }
                .now-playing { color: #ccc; font-size: 0.9rem; max-width: 50%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
                .close-btn { background: #d9534f; border: 1px solid #c9302c; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s; font-weight: bold; }
                .close-btn:hover { background: #c9302c; transform: scale(1.05); }
                .video-wrapper {
                    position: relative; z-index: 1; display: flex; justify-content: center; background: #000;
                    height: 40vh;
                }
                .shared-video {
                    width: 100%; height: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); outline: none;
                }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default MediaPlayer;
