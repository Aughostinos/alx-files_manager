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
    return new Promise((resolve, reject) => {
        this.client.get(key, (err, reply) => {
            if (err) reject(err);
            resolve(reply);
        });
    });
  }

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
        this.client.setex(key, duration, value, (err) => {
            if (err) reject(err);
            resolve(true);
        });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
        this.client.del(key, (err) => {
            if (err) reject(err);
            resolve(true);
        });
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;
