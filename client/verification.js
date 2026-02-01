import io from 'socket.io-client';

const socket = io('http://localhost:5000');

console.log('Connecting to server...');

socket.on('connect', () => {
    console.log('Connected to server!');

    const testMsg = {
        sender: 'TestBot',
        content: 'Verification Message ' + Date.now()
    };

    console.log('Sending message:', testMsg);
    socket.emit('message', testMsg);
});

socket.on('message', (data) => {
    if (data.sender === 'TestBot' && data.content.startsWith('Verification Message')) {
        console.log('Received broadcast back:', data);
        console.log('Verification SUCCESS');
        process.exit(0);
    }
});

setTimeout(() => {
    console.error('Verification Timeout');
    process.exit(1);
}, 5000);
