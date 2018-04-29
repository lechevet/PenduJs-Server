/**
 * <helpers/init/https.helper>
 * This file is use to set up the server to use https protocol instead of http
 */

// import * as fs from 'fs';
import * as http from 'http';

import { config } from '../../config';
import { logger } from '../logger.helper';

// console.log(process.cwd() + config.application.ssl.private_key);
// console.log(process.cwd() + config.application.ssl.certificate);

// const privateKey = fs.readFileSync(process.cwd() + config.application.ssl.private_key, 'utf8');
// const certificate = fs.readFileSync(process.cwd() + config.application.ssl.certificate, 'utf8');

// const credentials = {
//   key: privateKey,
//   cert: certificate,
//   passphrase: config.application.ssl.passphrase
// };

// export function initHttps(app: any): Promise<any> {
//   return new Promise(function(resolve: any, reject: any): any {
//     try {
//       const server = https.createServer(credentials, app);
//       server.listen(config.application.port);
//       const url = `${config.application.ip}:${config.application.port}`;
//       logger.info(`${config.application.name} listening on https://${url}`);
//    /*    if (config.application.mode === 'dev') {
//         process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
//       } */
//       resolve(server);
//     } catch (error) {
//       reject(error);
//     }
//   });
// }

export function initHttp(app: any): Promise<any> {
  return new Promise(function(resolve: any, reject: any): any {
    try {
      const server = http.createServer(app);
      server.listen(config.application.port_http);
      const url = `${config.application.ip}:${config.application.port_http}`;
      logger.info(`${config.application.name} listening on http://${url}`);
      resolve(server);
    } catch (error) {
      reject(error);
    }
  });
}

