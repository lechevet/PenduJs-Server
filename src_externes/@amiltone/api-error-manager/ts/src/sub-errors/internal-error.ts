import APIError from '../api-error';
import ErrorResources from '../resources';

export default class InternalError extends APIError {
  constructor(errorDetails:Object){
    super(
      ErrorResources.internalError.code,
      ErrorResources.internalError.message,
      errorDetails,
      500
    );
  }
};
