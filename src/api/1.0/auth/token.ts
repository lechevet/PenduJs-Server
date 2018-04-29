import { Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { checkPermissionLevel, Permissions } from '../../../helpers/permissions.helper';
import { usersService } from '../../../services/1.x/user.service';

export const del: Operation = async function (req: any, res: any, next: any): Promise<void> {
  try {
    // First we check the user permission
    checkPermissionLevel(
      req.user,
      [
        Permissions.DELETE_OWN_TOKEN
      ]
    );

    // Save the specified token
    await usersService.removePushToken(req.user.email_address);

    // logging the success
    logger.info(generateLog({
      method: req.method,
      url: req.url,
      userDbId: req.user.email_address || 'unknown',
      responseStatus: 200,
      responseMessage: 'Successfully removed user\'s push token.'
    }));
    res.sendStatus(200);

  } catch (error) {
    next(error);
  }
};

del.apiDoc = {
  summary: 'Set a user push token.',
  operationId: 'setPushToken',
  tags: ['Users', 'DELETE', 'Token', 'Auth'],
  responses: {
    200: {
      description: 'Push token suppression confirmation',
      schema: {},
      examples: {
        message: '200 OK'
      }
    },
    default: {
      description: 'An error occurred',
      schema: {
        $ref: '#/definitions/Error'
      }
    }
  }
};
