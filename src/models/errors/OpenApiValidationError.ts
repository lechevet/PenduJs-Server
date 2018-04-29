import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class OpenApiValidationError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40005,
      genericMessages[400] + error.message,
      {
        invalidParameters: error.invalidParameters
      },
      400
    );
  }
}
