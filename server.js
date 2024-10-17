import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import redisClient from './utils/redis.js';
import dbClient from './utils/db.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/', routes);

app.get('/health', async (req, res) => {
  const redisAlive = redisClient.isAlive();
  const dbAlive = await dbClient.isAlive();
  const status = redisAlive && dbAlive ? 'Healthy' : 'Unhealthy';

  res.status(redisAlive && dbAlive ? 200 : 500).json({
    status,
    redis: redisAlive,
    db: dbAlive,
  });
});

app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('SIGINT', async () => {
  console.log('Gracefully shutting down...');
  await redisClient.client.quit();
  await dbClient.client.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
