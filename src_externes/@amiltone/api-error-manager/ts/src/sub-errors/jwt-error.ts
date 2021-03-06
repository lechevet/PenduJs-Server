import APIError from '../api-error';
import ErrorResources from '../resources';

export default class MongoDBError extends APIError {
  constructor(error:any){
    let errorDetails:Object;
    switch(error.message) {
      case 'jwt malformed':
      errorDetails = {
        errorSubCode: ErrorResources.jwt.sub_errors.malformed.code,
        errorSubMessage: ErrorResources.jwt.sub_errors.malformed.message
      };
      break;
      case 'jwt signature is required':
        errorDetails = {
          errorSubCode: ErrorResources.jwt.sub_errors.missingSignature.code,
          errorSubMessage: ErrorResources.jwt.sub_errors.missingSignature.message
        };
      break;
      case 'invalid signature':
        errorDetails = {
          errorSubCode: ErrorResources.jwt.sub_errors.invalidSignature.code,
          errorSubMessage: ErrorResources.jwt.sub_errors.invalidSignature.message
        };
      break;
      case 'jwt must be provided':
        errorDetails = {
          errorSubCode: ErrorResources.jwt.sub_errors.missingToken.code,
          errorSubMessage: ErrorResources.jwt.sub_errors.missingToken.message
        };
      break;
      default:
        errorDetails = {
          errorSubCode: ErrorResources.jwt.sub_errors.unknown.code,
          errorSubMessage: ErrorResources.jwt.sub_errors.unknown.message
        };
      break;
    }

    super(
      ErrorResources.jwt.code,
      ErrorResources.jwt.message,
      errorDetails,
      500
    );
  }
};
