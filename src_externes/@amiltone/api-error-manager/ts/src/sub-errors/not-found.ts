import APIError from '../api-error';
import ErrorResources from '../resources';

export default class NotFoundError extends APIError {
  constructor(errorDetails:Object){
    super(
      ErrorResources.notFound.code,
      ErrorResources.notFound.message,
      errorDetails,
      404
    );
  }
};
