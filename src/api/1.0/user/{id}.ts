import { OpenApi, Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { checkPermissionLevel, Permissions } from '../../../helpers/permissions.helper';
import { usersService } from '../../../services/1.x/user.service';

const getParameters: OpenApi.Parameters =  [
  {
    name: 'id',
    in: 'path',
    type: 'string',
    required: true,
    description: 'user id.'
  }
];

export const get: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
    checkPermissionLevel(req.user, [ Permissions.GET_USERS ]);
    const user = await usersService.getUser(req.params.id);
    logger.info(generateLog({
      method: req.method,
      url: req.url,
      userDbId: req.user.email_address || 'unknown',
      responseStatus: 200,
      responseMessage: `User with id: ${req.params.id} successfully sent.`
    }));
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

get.apiDoc = {
  summary: 'Returns information about a specific user.',
  operationId: 'getUser',
  tags: ['Users', 'GET'],
  parameters: getParameters,
  responses: {
    200: {
      description: 'User information.',
      schema: {
        $ref: '#/definitions/User'
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
