import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class EmailError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40007,
      genericMessages[400] + error.message,
      {},
      400
    );
  }
}
