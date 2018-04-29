import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class WrongPermissionError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40302,
      genericMessages[403] + error.message,
      {},
      403
    );
  }
}
