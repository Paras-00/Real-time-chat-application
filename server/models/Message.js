import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: String, // Storing username or ID
        required: true
    },
    content: {
        type: String,
        required: false
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    room: {
        type: String,
        default: 'general'
    }
});

export default mongoose.model('Message', messageSchema);
