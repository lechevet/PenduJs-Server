import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class UnauthorizedError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40101,
      genericMessages[401] + error.message,
      {},
      401
    );
  }
}
