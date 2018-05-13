import { config } from '../../config';
import { DB } from '../../helpers/init/mongo-init.helper';
import { MongoHelperInterface } from '../../helpers/mongo.helper';
import { authService } from '../../services/1.x/auth.service';

export = {
  async up(mongoHelper: MongoHelperInterface): Promise<void> {
    await DB.collection(config.database.mongoDB.users_collection).deleteMany({});
    await DB.collection(config.database.mongoDB.db_migrations_collection).deleteMany({});
    const password = await authService.hashPassword(config.users.default.admin.password, {});
    await mongoHelper.insertOne(
      config.database.mongoDB.users_collection,
      {
        userName: 'Default',
        email_address: config.users.default.admin.login,
        role: 'Administrator',
        password
      }
    );
  },

  async down(_mongoHelper: MongoHelperInterface): Promise<void> {
    await DB.collection(config.database.mongoDB.users_collection).deleteMany({});
  }
};
