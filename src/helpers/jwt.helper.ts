import * as jwt from 'express-jwt';
import { config } from '../config';

export const jwtMiddleware: any = jwt({
  secret: config.application.jwt.secret
});

export const authorizedPath = [
  config.application.api.basePath + '/auth/forgetpassword',
  config.application.api.basePath + '/auth/login',
  config.application.api.basePath + '/auth/register',
  config.application.api.basePath + '/user/forgotten-password',
  config.application.api.basePath + '/auth/newpassword',
  config.application.api.basePath + '/auth/verifyToken',

  /^\/(docs|api-docs)/, // the documentation of the api
  {
    url: new RegExp('^' + config.application.api.basePath + '\\/tasks\\/{task_id}\\/images\\/{image_id}'),
    methods: 'GET'
  },
  {
    url: new RegExp('^' + config.application.api.basePath + '\\/tasks\\/[a-z0-9]*\\/images\\/.*'),
    methods: 'GET'
  }
];

export const AuthorizationParameters = {
  name: 'Authorization',
  in: 'header',
  required: true,
  type: 'string',
  description: 'JWT declaration. Format: Bearer JWT',
  default: 'Bearer '
};
