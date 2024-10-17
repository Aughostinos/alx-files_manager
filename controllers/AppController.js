import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class AppController {
  static getStatus(req, res) {
    try {
      const redisStatus = redisClient.isAlive();
      const dbStatus = dbClient.isAlive();

      res.status(200).json({
        redis: redisStatus,
        db: dbStatus,
      });
    } catch (error) {
      console.error('Error fetching status:', error);
      res.status(500).json({ error: 'Cannot fetch status' });
    }
  }

  static async getStats(req, res) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();

      res.status(200).json({ users, files });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Cannot retrieve statistics' });
    }
  }
}

export default AppController;
