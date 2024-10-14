import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = this.createClient();
    this.client.on('error', (err) => {
        console.error(`Redis client error: ${err}`);
    });
    }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;