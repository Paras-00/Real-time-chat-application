import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import socketHandler from './socket/socketHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
// Secure File Serving (View Only for others)
app.get('/uploads/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(__dirname, 'uploads', filename);

    // Rudimentary check: prevent direct execution or unexpected behavior
    // In real app, check req.user or session token here.

    if (fs.existsSync(filepath)) {
        // Force inline display (Browser tries to render, not download)
        // This makes "Viewing" the default behavior.
        res.setHeader('Content-Disposition', 'inline');

        // Optional: Block if 'sec-fetch-dest' is 'document' AND it's not from our referer (Anti-hotlink/Direct access)
        // For now, we just serve it inline.
        res.sendFile(filepath);
    } else {
        res.status(404).send('File not found');
    }
});

// File Upload Config
import multer from 'multer';
import fs from 'fs';

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl, fileType: req.file.mimetype });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/linksy')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Initialize Socket Logic
socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
