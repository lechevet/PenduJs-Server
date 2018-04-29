import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class TokenCreationError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40104,
      genericMessages[401] + error.message,
      {},
      401
    );
  }
}
