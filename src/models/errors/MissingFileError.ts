import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class MissingFileError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40001,
      genericMessages[400] + error.message,
      {},
      400
    );
  }
}
