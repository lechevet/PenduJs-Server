import APIErrors from './api-errors';
import APIError from './api-error';
import MongoDBError from './sub-errors/mongodb-error';
import JWTError from './sub-errors/jwt-error';
import InternalError from './sub-errors/internal-error';

const _isMongoError = (error:any) => {
  return (error.name !== undefined && error.name === 'MongoError');
};

const _isJWTError = (error:any) => {
  return (error.name !== undefined && error.name === 'JsonWebTokenError');
};

const _mongoError = (error:Error):APIError => {
  return new MongoDBError(error);
};

const _jwtError = (error:Error):APIError => {
  return new JWTError(error);
};

export default function(error:any, req:any, res:any, next:any) {
  let err = new APIErrors();
  if (error instanceof APIError) {
    err.add(error);
  }
  else if (error instanceof APIErrors) {}
  else if (_isMongoError(error)) {
    err.add(_mongoError(error));
  }
  else if (_isJWTError(error)) {
    err.add(_jwtError(error));
  }
  else {
      err.add(new InternalError(error));
  }

  res.status(err.errors[0].statusCode).json(err.errors);
};
