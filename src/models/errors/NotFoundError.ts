import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class NotFoundError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40401,
      genericMessages[404] + error.message,
      {},
      404
    );
  }
}
