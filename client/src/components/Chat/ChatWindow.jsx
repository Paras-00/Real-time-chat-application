import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

const ChatWindow = ({ currentChannel }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const messagesEndRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(() => sessionStorage.getItem('chat_username') || '');

    const API_BASE_URL = 'http://localhost:5000'; // Should ideally be in an env var

    // Emoji list
    const emojis = ['😀', '😂', '😍', '🔥', '👍', '🎉', '❤️', '🚀', '🤔', '👀', '💯', '💩'];

    useEffect(() => {
        if (!currentUser) {
            const storedUser = sessionStorage.getItem('chat_username');
            if (storedUser) {
                setCurrentUser(storedUser);
            } else {
                const name = prompt('Enter your username:') || `User_${Math.floor(Math.random() * 1000)}`;
                sessionStorage.setItem('chat_username', name);
                setCurrentUser(name);
            }
        }
    }, [currentUser]);

    useEffect(() => {
        if (!socket || !currentChannel) return;

        // Clean previous messages when switching channel
        setMessages([]);
        socket.emit('join_room', currentChannel);

        const handleInitMessages = (history) => {
            setMessages(history);
        };

        const handleMessage = (message) => {
            setMessages((prev) => [...prev, message]);
        };

        const handleTyping = (data) => {
            setIsTyping(data.isTyping);
            setTimeout(() => setIsTyping(false), 3000);
        };

        socket.on('init_messages', handleInitMessages);
        socket.on('message', handleMessage);
        socket.on('typing', handleTyping);

        return () => {
            socket.emit('leave_room', currentChannel);
            socket.off('message', handleMessage);
            socket.off('typing', handleTyping);
            socket.off('init_messages', handleInitMessages);
        };
    }, [socket, currentChannel]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (input.trim() && socket) {
            const messageData = {
                sender: currentUser,
                content: input,
                timestamp: new Date().toISOString(),
                room: currentChannel
            };

            socket.emit('message', messageData);
            setInput('');
            setShowEmoji(false);
        }
    };

    const addEmoji = (emoji) => {
        setInput(prev => prev + emoji);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInput = (e) => {
        setInput(e.target.value);
        if (socket) {
            socket.emit('typing', { isTyping: true, room: currentChannel });
        }
    }

    const handleFileUpload = async (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.fileUrl && socket) {
                const messageData = {
                    sender: currentUser,
                    content: `Sent a file: ${file.name}`,
                    fileUrl: data.fileUrl,
                    fileType: data.fileType,
                    timestamp: new Date().toISOString(),
                    room: currentChannel
                };
                socket.emit('message', messageData);
            }
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <span className="hash">#</span> {currentChannel.replace('dm_', '').replace(/_/g, ' + ')}
            </div>

            <div className="message-list">
                {messages.map((msg, index) => {
                    const isMe = msg.sender === currentUser;
                    return (
                        <div key={index} className={`message ${isMe ? 'me' : 'them'}`}>
                            {!isMe && <div className="avatar">{msg.sender[0]}</div>}
                            <div className="message-content">
                                <div className="message-header">
                                    <span className="username">{msg.sender}</span>
                                    <span className="timestamp">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="text-bubble">
                                    {msg.content}
                                    {msg.fileUrl && (
                                        <div className="attachment">
                                            {msg.fileType?.startsWith('image/') ? (
                                                <img
                                                    src={`${API_BASE_URL}${msg.fileUrl}`}
                                                    alt="attachment"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                    draggable={false}
                                                />
                                            ) : (
                                                <button
                                                    className="view-file-btn"
                                                    onClick={() => window.open(`${API_BASE_URL}${msg.fileUrl}`, '_blank')}
                                                >
                                                    📄 View {msg.fileType?.includes('pdf') ? 'PDF' : 'File'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isMe && <div className="avatar">{msg.sender[0]}</div>}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                {isTyping && <div className="typing-indicator">typing...</div>}

                {showEmoji && (
                    <div className="emoji-picker">
                        {emojis.map(e => <span key={e} onClick={() => addEmoji(e)}>{e}</span>)}
                    </div>
                )}

                <div className="input-container">
                    <button className="icon-btn" onClick={() => setShowEmoji(!showEmoji)}>😊</button>
                    <button className="icon-btn" onClick={() => document.getElementById('file-upload').click()}>📎</button>
                    <input
                        type="file"
                        id="file-upload"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                    />
                    <textarea
                        className="message-input"
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message #${currentChannel.replace('dm_', '')}`}
                        rows="1"
                    />
                    <button className="send-btn" onClick={sendMessage} disabled={!input.trim()}>➤</button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
