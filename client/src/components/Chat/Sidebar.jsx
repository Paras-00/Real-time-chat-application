import React from 'react';
import { useSocket } from '../../context/SocketContext';

const Sidebar = ({ currentChannel, setCurrentChannel, userProfile }) => {
    const socket = useSocket();
    const [channels, setChannels] = React.useState(['general', 'random', 'help']);
    const [favorites, setFavorites] = React.useState(() => {
        const saved = localStorage.getItem('chat_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [onlineUsers, setOnlineUsers] = React.useState([]);

    React.useEffect(() => {
        if (!socket) return;

        socket.on('online_users', (users) => {
            // Filter out current user
            const others = users.filter(u => u.username !== userProfile.username);
            setOnlineUsers(others);
        });

        return () => socket.off('online_users');
    }, [socket, userProfile]);

    const handleCreateChannel = () => {
        const name = prompt('Enter channel name:');
        if (name && !channels.includes(name)) {
            setChannels([...channels, name]);
            setCurrentChannel(name);
        }
    };

    const startDM = (otherUser) => {
        const participants = [userProfile.username, otherUser].sort();
        const dmRoom = `dm_${participants.join('_')}`;
        setCurrentChannel(dmRoom);
    };

    const toggleFavorite = (user) => {
        let newFavs;
        if (favorites.includes(user)) {
            newFavs = favorites.filter(u => u !== user);
        } else {
            newFavs = [...favorites, user];
        }
        setFavorites(newFavs);
        localStorage.setItem('chat_favorites', JSON.stringify(newFavs));
    };

    const handleProfileEdit = () => {
        sessionStorage.removeItem('chat_profile');
        sessionStorage.removeItem('chat_username');
        window.location.reload();
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                Linksy v2.0
            </div>

            <div className="channel-list">
                <div className="section-header">
                    <span>CHANNELS</span>
                    <button className="add-btn" onClick={handleCreateChannel}>+</button>
                </div>
                {channels.map(channel => (
                    <div
                        key={channel}
                        className={`channel-item ${currentChannel === channel ? 'active' : ''}`}
                        onClick={() => setCurrentChannel(channel)}
                    >
                        # {channel}
                    </div>
                ))}

                {favorites.length > 0 && (
                    <>
                        <div className="section-header" style={{ marginTop: '20px' }}>
                            FAVORITES ★
                        </div>
                        {favorites.map(user => (
                            <div
                                key={user}
                                className={`channel-item ${currentChannel.includes(user) ? 'active' : ''}`}
                                onClick={() => startDM(user)}
                            >
                                <span className="status-dot" style={{ color: '#f1c40f' }}>★</span> {user}
                            </div>
                        ))}
                    </>
                )}

                <div className="section-header" style={{ marginTop: '20px' }}>
                    ONLINE USERS ({onlineUsers.length})
                </div>
                {onlineUsers.length === 0 && (
                    <div style={{ padding: '10px 20px', color: '#666', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        No other users online
                    </div>
                )}
                {onlineUsers.map(u => (
                    <div key={u.username} className="user-item-row" style={{ padding: '5px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#aaa' }}>
                        <span onClick={() => startDM(u.username)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="status-dot-online">●</span> {u.username}
                        </span>
                        <button onClick={() => toggleFavorite(u.username)} style={{ background: 'none', border: 'none', color: favorites.includes(u.username) ? 'gold' : '#555', cursor: 'pointer', fontSize: '1.2rem' }}>★</button>
                    </div>
                ))}
            </div>

            <div className="user-status">
                <div className="avatar-sm" style={{ position: 'relative' }}>
                    {userProfile.avatar?.startsWith('http') ? <img src={userProfile.avatar} alt="Me" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : userProfile?.username[0]}
                    <span className="status-dot-online" style={{ position: 'absolute', bottom: '-2px', right: '-2px', fontSize: '0.6rem' }}>●</span>
                </div>
                <div className="user-info" style={{ flex: 1 }}>
                    <div className="name">{userProfile.username}</div>
                    <div className="status">Online</div>
                </div>
                <button onClick={handleProfileEdit} style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }} title="Edit Profile">✏️</button>
            </div>

            <style>{`
                .status-dot-online {
                    color: #89d185;
                    filter: drop-shadow(0 0 3px #89d185);
                }
            `}</style>
        </div>
    );
};

export default Sidebar;
