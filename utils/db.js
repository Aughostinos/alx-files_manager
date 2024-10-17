import mongodb from 'mongodb';

const { MongoClient, ObjectId } = mongodb;

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.db = null;

    this.client.connect()
      .then(() => {
        console.log('MongoDB connected successfully');
        this.db = this.client.db(database);
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
      });
  }

  async isAlive() {
    try {
      await this.client.db('admin').command({ ping: 1 });
      return true;
    } catch (error) {
      console.error('MongoDB ping failed:', error);
      return false;
    }
  }

  async nbUsers() {
    try {
      return await this.db.collection('users').countDocuments();
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  async nbFiles() {
    try {
      return await this.db.collection('files').countDocuments();
    } catch (error) {
      console.error('Error counting files:', error);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
export { ObjectId };
