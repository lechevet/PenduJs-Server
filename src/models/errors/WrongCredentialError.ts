import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class WrongCredentialError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40103,
      genericMessages[401] + error.message,
      {},
      401
    );
  }
}
