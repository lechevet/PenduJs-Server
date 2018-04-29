import { expect } from 'chai';
import { MongoClient } from 'mongodb';

import { config } from '../../config';
import { mongoInit } from '../../helpers/init/mongo-init.helper';

describe('APPLICATION UNIT TESTS', async function(): Promise<void> {

  describe('database set up', async function(): Promise<void> {

    it('should connect to the database', async function(): Promise<void> {
      const url = config.database.mongoDB.url + ':'
        + config.database.mongoDB.port + '/'
        + config.database.mongoDB.database_name;

      await MongoClient.connect(url, function(err: any, db: any): void {
        expect(err).to.equal(null);
        db.close();
      });
      await mongoInit();
    });
  });
});
