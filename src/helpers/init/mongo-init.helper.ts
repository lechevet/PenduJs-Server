import { MongoClient } from 'mongodb';

import { config } from '../../config';
import { logger } from '../logger.helper';

export let DB: any = null;

const connectUrl = `${config.database.mongoDB.url}:${config.database.mongoDB.port}/${config.database.mongoDB.database_name}`;

export function mongoInit(): Promise<any> {
  return MongoClient.connect(connectUrl)
    .then(function(db: any): void {
      DB = db;
      logger.info('--> Connected to mongoDB');
    });
}
