import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class AuthController {
  static async getConnect(req, res) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
      }

      const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
      const [email, password] = credentials.split(':');

      if (!email || !password) {
        return res.status(401).json({ error: 'Unauthorized: Email and password are required' });
      }

      const hashedPassword = sha1(password);
      const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
      }

      const token = uuidv4();
      try {
        await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
      } catch (redisError) {
        console.error('Redis error:', redisError);
        return res.status(500).json({ error: 'Internal Server Error: Redis operation failed' });
      }

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error during authentication:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    try {
      const token = req.headers['x-token'];

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
      }

      try {
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        await redisClient.del(`auth_${token}`);
        return res.status(204).send();
      } catch (redisError) {
        console.error('Redis error during logout:', redisError);
        return res.status(500).json({ error: 'Internal Server Error: Redis operation failed' });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;
