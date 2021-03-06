import APIError from '../api-error';
import ErrorResources from '../resources';

export default class MongoDBError extends APIError {
  constructor(error:any){
    super(
      ErrorResources.internalError.code,
      ErrorResources.internalError.message,
      {
        errorSubCode: error.code,
        errorSubMessage: error.message
      },
      500
    );
  }
};
