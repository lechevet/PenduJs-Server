import { Operation } from 'express-openapi';

import { generateLog, logger } from '../../helpers/logger.helper';
import { checkPermissionLevel, Permissions } from '../../helpers/permissions.helper';
import { usersService } from '../../services/1.x/user.service';

const getParameters = [
  {
    name: 'firstName',
    in: 'query',
    type: 'string',
    description: 'user first name.'
  },
  {
    name: 'lastName',
    in: 'query',
    type: 'string',
    description: 'user last name.'
  },
  {
    name: 'status',
    in: 'query',
    type: 'string',
    description: 'user status.'
  },
  {
    name: 'role_title',
    in: 'query',
    type: 'string',
    description: 'role of the user.'
  },
  {
    name: 'offset',
    in: 'query',
    type: 'integer',
    description: 'Skip value for the return of users'
  },
  {
    name: 'limit',
    in: 'query',
    type: 'integer',
    description: 'Maximum number of users we want'
  },
  {
    name: 'order',
    in: 'query',
    type: 'integer',
    enum: [1, -1],
    description: 'order for sorting the result'
  },
  {
    name: 'sort',
    in: 'query',
    type: 'string',
    description: 'Sorting for the result in the mongoDB format.'
  },
  {
    name: 'fields',
    in: 'query',
    type: 'array',
    items: {
      type: 'string'
    },
    description: 'List of the fields to returns'
  }
];

export const get: Operation = async function(req: any, res: any, next: any): Promise<void> {
    try {
      checkPermissionLevel(
        req.user,
        [
          Permissions.GET_USERS
        ]
      );
      const users = await usersService.getUsers(req.query);
      logger.info(generateLog({
        method: req.method,
        url: req.url,
        userDbId: req.user.email_address || 'unknown',
        responseStatus: 200,
        responseMessage: 'User list sent successfully.'
      }));
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
};

get.apiDoc = {
  summary: 'Get the list of users',
  operationId: 'getUsers',
  tags: [ 'Users', 'GET' ],
  parameters: getParameters,
  responses: {
    200: {
      description: 'A list of all users.',
      schema: {
        type: 'array',
        items: {
          $ref: '#/definitions/User'
        }
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
