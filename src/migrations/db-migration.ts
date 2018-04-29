import { config } from '../config';
import { glob } from '../helpers/glob.helper';
import { DB, mongoInit } from '../helpers/init/mongo-init.helper';
import { logger } from '../helpers/logger.helper';
import { MongoHelper } from '../helpers/mongo.helper';

const migrationFolder = process.cwd() + '/build/migrations/' + config.database.migration.version;
const mongoHelper = new MongoHelper();

async function migrate(): Promise<void> {
  await mongoInit();

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
    .map(item => (item.file_name))
    .filter(item => item);
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
      logger.info(`Migration '${fileName}' done`);

      // And add it to the done migrations list
      await DB.collection(config.database.mongoDB.db_migrations_collection)
        .insertOne({ file_name: fileName });
    } catch (error) {
      error.fileName = fileName;
      throw error;
    }
  }
}

async function migrateUndo(): Promise<string|null> {
  await mongoInit();

  // Fetch all the done migrations
  const doneMigrations = await DB.collection(config.database.mongoDB.db_migrations_collection)
    .find({})
    .sort({ file_name: -1 })
    .toArray();

  // If no migration is already done, return
  if (doneMigrations.length < 1) {
    return null;
  }

  // Fetch the most recent migration
  const fileName = doneMigrations[0].file_name;

  // and its scripts
  const migration = require(migrationFolder + '/' + fileName);

  // Rollback it by running its down script
  await migration.down(mongoHelper);

  // And remove it from DB
  await DB.collection(config.database.mongoDB.db_migrations_collection)
    .removeOne({ _id: doneMigrations[0]._id });
  return fileName;
}

const action = process.argv[2];
if (action === 'undo') {
  migrateUndo()
    .then((migration) => {
      if (migration) {
        logger.info('Migration ' + migration + ' undone');
      } else {
        logger.info('Nothing left to undo');
      }
    })
    .catch((err) => {
      logger.error('Error', err);
      process.exitCode = 1;
    });
} else {
  migrate()
    .then(() => {
      logger.info('Migration finished');
    })
    .catch((error) => {
      logger.error(`Error while handling '${error.fileName}' migration`, error);
      process.exitCode = 1;
    });
}
