import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class InvalidFileFormatError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40004,
      genericMessages[400] + error.message,
      {},
      400
    );
  }
}

