import { NextFunction } from 'express';
import * as express from 'express';
import { JwtValidationError } from './errors/JwtValidationError';

export const genericMessages = {
  400: 'Bad request: ',
  401: 'Authentication error: ',
  403: 'You are not authorized to access this information: ',
  404: 'Can\'t find the requested information: '
};

export const errorHandler: express.ErrorRequestHandler = (err, _req, res, next: NextFunction) => {
  if (err && err.name === 'UnauthorizedError') {
    err = new JwtValidationError(err);
  }
  res.status(err.statusCode || err.status || 500).json(err);
  return next();
};
