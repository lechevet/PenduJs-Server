import APIError from '../api-error';
import ErrorResources from '../resources';

export default class TooLongURIError extends APIError {
  constructor(){
    super(
      ErrorResources.tooLongURI.code,
      ErrorResources.tooLongURI.message,
      undefined,
      414
    );
  }
};
