import Queue from 'bull';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import { promises as fs } from 'fs';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    return done(new Error('Missing fileId'));
  }

  if (!userId) {
    return done(new Error('Missing userId'));
  }

  const file = await dbClient.db.collection('files').findOne({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) {
    return done(new Error('File not found'));
  }

  if (file.type !== 'image') {
    return done(new Error('File is not an image'));
  }

  try {
    const options = [
      { width: 500 },
      { width: 250 },
      { width: 100 },
    ];

    const originalData = await fs.readFile(file.localPath);

    const thumbnailPromises = options.map(async (option) => {
      const thumbnail = await imageThumbnail(originalData, option);
      const thumbnailPath = `${file.localPath}_${option.width}`;
      await fs.writeFile(thumbnailPath, thumbnail);
    });

    await Promise.all(thumbnailPromises);
    done();
  } catch (error) {
    done(error);
  }
});
