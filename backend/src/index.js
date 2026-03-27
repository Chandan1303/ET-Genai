import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import chatRoutes from './routes/chat.js';
import fileUploadRoutes from './routes/fileUpload.js';
import toolsRoutes from './routes/tools.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected AI routes
app.use('/api/ai', authMiddleware);
app.use('/api/ai/agents', agentRoutes);
app.use('/api/ai/chat', chatRoutes);
app.use('/api/ai/upload', fileUploadRoutes);
app.use('/api/ai/tools', toolsRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
