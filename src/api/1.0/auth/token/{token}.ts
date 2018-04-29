import { OpenApi, Operation } from 'express-openapi';

import { generateLog, logger } from '../../../../helpers/logger.helper';
import { checkPermissionLevel, Permissions } from '../../../../helpers/permissions.helper';
import { usersService } from '../../../../services/1.x/user.service';


const putParameters: OpenApi.Parameters = [
  {
    name: 'token',
    in: 'path',
    required: true,
    type: 'string'
  }
];

export const put: Operation = async function (req: any, res: any, next: any): Promise<void> {
  try {
    checkPermissionLevel(
      req.user,
      [
        Permissions.SET_OWN_TOKEN
      ]
    );

    // Save the specified token
    const insertionResult = await usersService.setPushToken(req.params.token, req.user.email_address);

    // logging the success
    logger.info(generateLog({
      method: req.method,
      url: req.url,
      userDbId: req.user.email_address || 'unknown',
      responseStatus: 200,
      responseMessage: 'Successfully set user\'s push token.'
    }));
    res.status(200).json(insertionResult);

  } catch (error) {
    next(error);
  }
};

put.apiDoc = {
  summary: 'Set a user push token.',
  operationId: 'setPushToken',
  tags: ['Users', 'PUT', 'Token', 'Auth'],
  parameters: putParameters,
  responses: {
    200: {
      description: 'Push token definition confirmation',
      schema: {},
      examples: {
        message: 'Successfully set user\'s push token'
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
