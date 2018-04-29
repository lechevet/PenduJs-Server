import { config } from '../config';
import { glob } from './glob.helper';
import { DB, mongoInit } from './init/mongo-init.helper';
import { logger } from './logger.helper';
import { MongoHelper } from './mongo.helper';

const version = process.env.VERSION || '1.x';

async function migrate(): Promise<void> {
  await mongoInit();
  const mongoHelper = new MongoHelper();
  const migrationFolder = process.cwd() + '/build/migrations/' + version;
  // Step 1 : Fetch files
  const migrationFiles = await glob(migrationFolder + '/*.js');

  // Step 2 : Fetch done migrations

  // Fetch all the done migrations
  let doneMigrations = await DB.collection(config.database.mongoDB.db_migrations_collection)
    .find({})
    .sort({ file_name: 1 })
    .toArray();

  // Filter them by their "file_name" attribute
  doneMigrations = doneMigrations
    .map(elmt => (elmt.file_name))
    .filter(elmt => elmt);
  const latestDoneMigration = doneMigrations.length > 0 ?
    parseInt(doneMigrations[doneMigrations.length - 1].split('-')[0]) : 0;

  // In order to get the undone migration file name, remove their absolute path in order to get their name,
  // and remove the ones that are already done
  const todoMigrations = migrationFiles
    .map(filePath => (filePath.split('/').pop()))
    .filter(file => file
                    && doneMigrations.indexOf(file) === -1
                    && parseInt(file.split('-')[0]) > latestDoneMigration);

  // Step 3 : Run missing migrations + add them to the done migrations

  for (const fileName of todoMigrations) {
    try {

      // Require the file. Its format should be {up: [Function], down: [Function]}
      const migration = require(migrationFolder + '/' + fileName);

      // Run its "up" function
      await migration.up(mongoHelper);
      logger.info('Migration ' + fileName + ' done');

      // And add it to the done migrations list
      await DB.collection(config.database.mongoDB.db_migrations_collection)
        .insertOne({
          file_name: fileName
        });
    } catch (err) {
      err.fileName = fileName;
      throw err;
    }
  }
  return;
}


migrate()
  .then(() => {
    logger.info('Migration finished');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('Error while handling ' + err.fileName + ' migration', err);
    process.exit();
  });
