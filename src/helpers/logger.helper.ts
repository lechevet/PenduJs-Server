import * as winston from 'winston';
import * as moment from 'moment';
import { config } from '../config';

const logFileName = `${process.cwd()}${config.application.log.dir}/.log`;

export const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: () => (moment().format('HH:mm:ss')),
      colorize: true,
      level: 'info'
    }),
    new (require('winston-daily-rotate-file'))({
      filename: logFileName,
      timestamp: () => (moment().format('HH:mm:ss')),
      datePattern: 'yyyy-MM-dd',
      prepend: true,
      level: 'info',
      colorize: false,
      json: false
    })
  ]
});

export const generateLog = function (data: object): string {
  let log = 'id="webfactory-api" ';
  for (const key in data) {
    const value = (data[key] !== undefined && data[key] !== null) ? data[key] : '';
    if (value instanceof Date) {
      log += `${key}="${value.toISOString()}"`;
    } else if (Array.isArray(value) === true) {
      log += `${key}="${value.join(',')}"`;
    } else {
      log += `${key}="${value.toString().replace(/"/g, '')}"`;
    }
  }
  return log;
};
