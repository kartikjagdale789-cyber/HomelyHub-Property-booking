import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './utils/db.js';
import { router } from './routes/userRoutes.js';
import { propertyRouter } from './routes/propertyRouter.js';
import { bookingRouter } from './routes/bookingRouter.js';
import { aiRouter } from './routes/aiRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.ORIGIN_ACCESS_URL,
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

const port = process.env.PORT || 8080;

connectDB();
app.use('/api/v1/rent/user', router);
app.use('/api/v1/rent/listing', propertyRouter);
app.use('/api/v1/rent/user/booking', bookingRouter);
app.use('/api/ai', aiRouter);

app.listen(port, () => {
  console.log('App running on port: ' + port);
});