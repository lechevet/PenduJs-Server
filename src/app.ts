import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as multer from 'multer';
import * as fs from 'mz/fs';
import * as SocketIO from 'socket.io';

import { config } from './config';

import { NextFunction } from 'express';
import * as httpHelper from './helpers/init/https.helper';
import { mongoInit } from './helpers/init/mongo-init.helper';
import * as openapiSetup from './helpers/init/openapi-setup.helper';
import * as jwtHelper from './helpers/jwt.helper';
import { logger } from './helpers/logger.helper';
import { errorHandler } from './models/error';
import { Hangman } from './models/hangman';

export const app: any = express();

process.title = config.application.process_title;


// Starting up of the server
async function init(): Promise<void> {
  try {
    logger.info('Initializing logger');

    const logFolderPath = process.cwd() + config.application.log.dir;
    try {
      await fs.stat(logFolderPath);
    } catch (error) {
      await fs.mkdir(logFolderPath);
    }

    logger.info('Connecting to database');

    await mongoInit();

    logger.info('Setting up middlewares');

    // app.use(bodyParser({limit: '2mb'}));
    // app.use(bodyParser.urlencoded({limit: '2mb'}));
    // app.use(bodyParser());


    app.use(bodyParser.json({limit: '2mb'}));
    app.use(bodyParser.urlencoded({
      limit: '2mb',
      extended: true
    }));

    app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.url}`);
      return next();
    });

    // allowing CORS requests
    app.use(function (_req: any, res: any, next: any): void {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE, PATCH');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, x-xsrf-token, Content-Type, Accept, Authorization'
      );
      next();
    });

    const storage = multer.memoryStorage();
    app.use(multer({ storage }).any());

    logger.info('Initializing JWT');
    app.use(
      jwtHelper.jwtMiddleware
        .unless({ path: jwtHelper.authorizedPath })
    );
    logger.info('--> JWT route protection activated');

    // Route declaration
    logger.info('Initialization step 4: Route declaration ...');
    await openapiSetup.init(app);

    // Setting up the 404 page
    app.get('*', function (_req: any, _res: any): void {
      throw new Error('404 not found');
    });

    // Server start up (listening for http connection)
    logger.info('Initialization step 5: Http server start up ...');
    await httpHelper.initHttp(app)
      .then(
        server => {
          let io = new SocketIO(server);
          let hangman = new Hangman(io);
          hangman.startGame();
        });

    app.use(errorHandler);

    // End of Initialization
    logger.info('The server finished to inititialize');
  } catch (error) {
    logger.error(`The server Initialization got an error :
    Error details : ${JSON.stringify(error)}
    Error message : ${error.message}`);
    process.exit(1);
  }
}

init().then(() => {
  app.emit('appStarted');
});
