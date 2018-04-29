import { Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { authService } from '../../../services/1.x/auth.service';

export const post: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
    const userResponse: any = await authService.changePassword(req.body);
    logger.info(generateLog({
      responseStatus: 201,
      responseMessage: `Password of user with id: ${userResponse.email_address} successfully updated.`
    }));
    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

post.apiDoc = {
  summary: 'Change user password',
  operationId: 'changePassword',
  tags: ['Auth', 'Login', 'POST'],
  parameters: [
    {
      name: 'credential',
      in: 'body',
      schema: {
        type: 'object',
        required: ['password1', 'password2', 'token'],
        properties: {
          password1: {
            type: 'string'
          },
          password2: {
            type: 'string'
          },
          token: {
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
      description: 'User password succesfully change',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object'
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
