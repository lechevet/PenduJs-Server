import * as ErrorManager from '@amiltone/api-error-manager';
import { genericMessages } from '../error';

export class InvalidFileError extends ErrorManager.APIError {
  constructor(error: any) {
    super(
      40003,
      genericMessages[400] + error.message,
      (error.syscall === 'mkdir') ? error : {},
      400
    );
  }
}
