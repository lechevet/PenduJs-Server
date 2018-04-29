import { Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { authService } from '../../../services/1.x/auth.service';

export const post: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
    const userResponse: any = await authService.changeForgetPassword(req.body);
    logger.info(generateLog({
      responseStatus: 201,
      responseMessage: `Verification token ok. Login user`
    }));
    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

post.apiDoc = {
  summary: 'Forget user password',
  operationId: 'forgetPassword',
  tags: ['Auth', 'Login', 'POST'],
  parameters: [
    {
      name: 'credential',
      in: 'body',
      schema: {
        type: 'object',
        required: ['token'],
        properties: {
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
      description: 'User can now change password',
      schema: {
        type: 'object',
        properties: {
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
