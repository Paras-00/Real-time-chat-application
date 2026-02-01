import React from 'react';
import { useSocket } from '../../context/SocketContext';

const ParticipantsPanel = ({ currentChannel, userProfile, onStartDM }) => {
    const socket = useSocket();
    const [onlineUsers, setOnlineUsers] = React.useState([]);

    React.useEffect(() => {
        if (!socket) return;

        socket.on('online_users', (users) => {
            const others = users.filter(u => u.username !== userProfile.username);
            setOnlineUsers(others);
        });

        return () => socket.off('online_users');
    }, [socket, userProfile]);

    // Don't show panel for DMs
    if (currentChannel.startsWith('dm_')) {
        return null;
    }

    return (
        <div className="participants-panel">
            <div className="panel-header">
                <span>PARTICIPANTS ({onlineUsers.length + 1})</span>
            </div>

            <div className="participants-list">
                {/* Current user first */}
                <div className="participant-item current-user">
                    <div className="participant-avatar">
                        {userProfile.avatar?.startsWith('http') ?
                            <img src={userProfile.avatar} alt={userProfile.username} /> :
                            userProfile.username[0]
                        }
                        <span className="status-indicator online">●</span>
                    </div>
                    <div className="participant-info">
                        <div className="participant-name">{userProfile.username} (You)</div>
                        <div className="participant-status">Online</div>
                    </div>
                </div>

                {/* Other online users */}
                {onlineUsers.map(user => (
                    <div
                        key={user.username}
                        className="participant-item"
                        onClick={() => onStartDM(user.username)}
                        title={`Click to message ${user.username}`}
                    >
                        <div className="participant-avatar">
                            {user.avatar?.startsWith('http') ?
                                <img src={user.avatar} alt={user.username} /> :
                                user.username[0]
                            }
                            <span className="status-indicator online">●</span>
                        </div>
                        <div className="participant-info">
                            <div className="participant-name">{user.username}</div>
                            <div className="participant-status">Online</div>
                        </div>
                        <div className="dm-icon">💬</div>
                    </div>
                ))}
            </div>

            <style>{`
                .participants-panel {
                    width: 220px;
                    background: #252526;
                    border-left: 1px solid #3e3e42;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .panel-header {
                    padding: 15px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    color: #aaa;
                    background: #2d2d2d;
                    border-bottom: 1px solid #3e3e42;
                }
                
                .participants-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                }
                
                .participant-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-bottom: 5px;
                }
                
                .participant-item:hover {
                    background: #37373d;
                }
                
                .participant-item.current-user {
                    background: #2d2d2d;
                    cursor: default;
                }
                
                .participant-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #007acc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 0.9rem;
                    position: relative;
                    flex-shrink: 0;
                }
                
                .participant-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                
                .status-indicator {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    font-size: 0.7rem;
                }
                
                .status-indicator.online {
                    color: #89d185;
                    filter: drop-shadow(0 0 3px #89d185);
                }
                
                .participant-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .participant-name {
                    font-size: 0.9rem;
                    color: #d4d4d4;
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .participant-status {
                    font-size: 0.75rem;
                    color: #89d185;
                }
                
                .dm-icon {
                    opacity: 0;
                    transition: opacity 0.2s;
                    font-size: 1rem;
                }
                
                .participant-item:hover .dm-icon {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default ParticipantsPanel;
