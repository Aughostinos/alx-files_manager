import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.headers['x-token'];

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name, type, parentId = 0, isPublic = false, data,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type or invalid type' });
      }
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId !== 0) {
        let parentFile;
        try {
          parentFile = await dbClient.db
            .collection('files')
            .findOne({ _id: dbClient.ObjectID(parentId) });
        } catch (err) {
          return res.status(400).json({ error: 'Invalid parentId' });
        }

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      await mkdirAsync(folderPath, { recursive: true });

      const fileDocument = {
        userId: dbClient.ObjectID(userId),
        name,
        type,
        isPublic,
        parentId: parentId === 0 ? '0' : dbClient.ObjectID(parentId),
      };

      if (type !== 'folder') {
        const fileId = uuidv4();
        const localPath = path.join(folderPath, fileId);

        const fileData = Buffer.from(data, 'base64');
        await writeFileAsync(localPath, fileData);

        fileDocument.localPath = localPath;
      }

      const result = await dbClient.db.collection('files').insertOne(fileDocument);

      return res.status(201).json({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
