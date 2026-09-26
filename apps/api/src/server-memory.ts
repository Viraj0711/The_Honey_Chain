import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.MONGODB_URI = process.env.MONGODB_URI || '';
const mem = await MongoMemoryServer.create();
process.env.MONGODB_URI = mem.getUri('honeychain');
console.log('in-memory mongodb ready');

await import('./server.js');
