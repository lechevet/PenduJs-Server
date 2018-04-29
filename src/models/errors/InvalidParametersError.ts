import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class InvalidParametersError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40002,
      genericMessages[400] + error.message,
      {},
      400
    );
  }
}

