import { Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { authService } from '../../../services/1.x/auth.service';

export const post: Operation = async function(req: any, res: any, next: any): Promise<void> {
    try {
      const tokenValid: any = await authService.verifyToken(req.body.token);
      logger.info(generateLog({
        method: req.method,
        url: req.url,
        responseStatus: 200,
        responseMessage: `Token is valid.`
      }));
      res.status(200).json({tokenValid});
    } catch (error) {
      next(error);
    }
};

post.apiDoc = {
  summary: 'Verify if token is valid',
  operationId: 'verifytoken',
  tags: ['Token'],
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
      description: 'User token'
    }
  ],
  responses: {
    200: {
      description: 'Token validity: true/false',
      schema: {
        type: 'object',
        properties: {
          tokenValid: {
            type: 'boolean'
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
