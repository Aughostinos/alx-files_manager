import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join as pathJoin } from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db
      .collection('users')
      .findOne({ _id: dbClient.ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const allowedTypes = ['folder', 'file', 'image'];
    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let parentFileId = parentId === 0 ? 0 : parentId;
    if (parentId !== 0) {
      if (!dbClient.isValidId(parentId)) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      const parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: dbClient.ObjectId(parentId) });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
      parentFileId = dbClient.ObjectId(parentId);
    }

    const fileDocument = {
      userId: dbClient.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentFileId,
    };

    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json({
        id: result.insertedId.toString(),
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    } else {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      await fs.mkdir(folderPath, { recursive: true });

      const localPath = pathJoin(folderPath, uuidv4());
      const fileData = Buffer.from(data, 'base64');

      try {
        await fs.writeFile(localPath, fileData);
      } catch (error) {
        return res.status(500).json({ error: 'Error saving file' });
      }

      fileDocument.localPath = localPath;

      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json({
        id: result.insertedId.toString(),
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }
  }
}

export default FilesController;
