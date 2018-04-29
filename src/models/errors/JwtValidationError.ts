import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class JwtValidationError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40105,
      genericMessages[400] + error.message,
      {
        code: error.code
      },
      401
    );
  }
}
