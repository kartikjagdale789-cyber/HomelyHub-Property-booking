import express from 'express';
import { handleChat } from '../ai/tripController.js';

const aiRouter = express.Router();

// POST /api/ai/chat
aiRouter.route('/chat').post(handleChat);

export { aiRouter };
