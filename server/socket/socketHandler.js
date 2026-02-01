import Message from '../models/Message.js';

const onlineUsers = new Map(); // socketId -> userProfile

export default (io) => {
    io.on('connection', async (socket) => {
        console.log('User connected:', socket.id);

        socket.on('user_join', (profile) => {
            onlineUsers.set(socket.id, profile);
            console.log(`User ${profile.username} joined`);
            io.emit('online_users', Array.from(onlineUsers.values()));
        });

        socket.on('join_room', async (room) => {
            socket.join(room);
            console.log(`User ${socket.id} joined room: ${room}`);

            try {
                const messages = await Message.find({ room }).sort({ timestamp: 1 }).limit(50);
                socket.emit('init_messages', messages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        });

        socket.on('leave_room', (room) => {
            socket.leave(room);
            console.log(`User ${socket.id} left room: ${room}`);
        });

        socket.on('message', async (data) => {
            try {
                const newMessage = new Message({
                    sender: data.sender,
                    content: data.content,
                    fileUrl: data.fileUrl,
                    fileType: data.fileType,
                    timestamp: data.timestamp || new Date(),
                    room: data.room || 'general'
                });

                await newMessage.save();
                io.to(newMessage.room).emit('message', newMessage);
            } catch (err) {
                console.error('Error saving message:', err);
            }
        });

        socket.on('typing', (data) => {
            socket.to(data.room).emit('typing', data);
        });

        socket.on('media_action', (data) => {
            // Broadcast to everyone in the room except the sender
            socket.to(data.room).emit('media_update', data);
        });

        socket.on('request_media_state', (room) => {
            // Ask the first person in the room (besides the requester) to send the current state
            const roomClients = io.sockets.adapter.rooms.get(room);
            if (roomClients && roomClients.size > 1) {
                // Get one existing client in the room to provide the state
                const existingClient = Array.from(roomClients).find(id => id !== socket.id);
                if (existingClient) {
                    io.to(existingClient).emit('get_current_state', { requesterId: socket.id });
                }
            }
        });

        socket.on('send_media_state', (data) => {
            // Relay the state from an existing user to the new joiner
            io.to(data.to).emit('media_update', {
                type: 'sync',
                payload: data.state
            });
        });

        socket.on('disconnect', () => {
            const user = onlineUsers.get(socket.id);
            if (user) {
                console.log(`User ${user.username} disconnected`);
                onlineUsers.delete(socket.id);
                io.emit('online_users', Array.from(onlineUsers.values()));
            }
        });
    });
};
