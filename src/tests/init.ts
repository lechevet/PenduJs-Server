import { app } from '../app';
import { config } from '../config';

export const checkStarted = function (cb: any): any {
  if (config.application.appStarted) {
    return cb();
  } else {
    return app.on('appStarted', () => {
      config.application.appStarted = true;
      return cb();
    });
  }
};
