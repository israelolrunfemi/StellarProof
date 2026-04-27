import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import healthRoutes from './routes/health.routes';
import storageRoutes from './routes/v1/storage.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/storage', storageRoutes);

// Base route
app.get('/', (_req: Request, res: Response) => {
  res.send('StellarProof Backend API is running');
});

app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});