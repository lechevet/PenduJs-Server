import APIError from '../api-error';
import ErrorResources from '../resources';

export default class MissingFieldError extends APIError {
  constructor(field:string){
    super(
      ErrorResources.missingField.code,
      ErrorResources.missingField.message,
      { field: field },
      400
    );
  }
};
