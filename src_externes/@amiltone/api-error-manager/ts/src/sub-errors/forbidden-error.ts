import APIError from '../api-error';
import ErrorResources from '../resources';

export default class ForbiddenError extends APIError {
  constructor(errorDetails:Object){
    super(
      ErrorResources.forbiddenError.code,
      ErrorResources.forbiddenError.message,
      errorDetails,
      403
    );
  }
};
