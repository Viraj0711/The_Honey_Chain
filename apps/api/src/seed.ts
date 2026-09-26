import 'dotenv/config';
import mongoose from 'mongoose';
import { seedDemo } from './seedDemo.js';

const uri = process.env.MONGODB_URI && process.env.MONGODB_URI !== '' ? process.env.MONGODB_URI : 'mongodb://127.0.0.1:27017/honeychain';
await mongoose.connect(uri);
await seedDemo();
await mongoose.disconnect();
