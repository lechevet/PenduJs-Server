import { Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { authService } from '../../../services/1.x/auth.service';

export const post: Operation = async function(req: any, res: any, next: any): Promise<void> {
    try {
      const authResponse: any = await authService.userLogin(req.body);
      logger.info(generateLog({
        method: req.method,
        url: req.url,
        userDbId: authResponse.user._id || 'unknown',
        responseStatus: 200,
        responseMessage: `User with id: ${authResponse.user._id} successfully loggin.`
      }));
      res.status(200).json(authResponse);
    } catch (error) {
      next(error);
    }
};

post.apiDoc = {
  summary: 'Logs in a user',
  operationId: 'userLogin',
  tags: ['Auth', 'Login', 'POST'],
  parameters: [
    {
      name: 'credential',
      in: 'body',
      schema: {
        type: 'object',
        required: ['login', 'password'],
        properties: {
          login: {
            type: 'string'
          },
          password: {
            type: 'string'
          }
        }
      },
      required: true,
      description: 'User credential'
    }
  ],
  responses: {
    200: {
      description: 'User logged in',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object'
          },
          token: {
            type: 'string'
          }
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
