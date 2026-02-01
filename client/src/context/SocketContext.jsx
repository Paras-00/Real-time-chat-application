import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:5000', {
            transports: ['websocket'],
            reconnection: true,
        });
        setSocket(newSocket);

        // Emit user profile when socket connects
        const profile = sessionStorage.getItem('chat_profile');
        if (profile) {
            newSocket.on('connect', () => {
                newSocket.emit('user_join', JSON.parse(profile));
            });
        }

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
