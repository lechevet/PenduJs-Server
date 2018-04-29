import { Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { authService } from '../../../services/1.x/auth.service';
import { checkPermissionLevel, Permissions } from '../../../helpers/permissions.helper';

export const get: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
      checkPermissionLevel(
          req.user,
          [
              Permissions.GET_REGISTERS
          ]
      );
      const register = await authService.getRegisters();
      logger.info(generateLog({
        method: req.method,
        url: req.url,
        responseStatus: 200,
        responseMessage: 'Register list sent successfully.'
      }));
      res.status(200).json(register);
  } catch (error) {
    next(error);
  }
};

get.apiDoc = {
  summary: 'return the pending users',
  operationId: 'getRegisters',
  tags: ['Auth', 'GET'],
  responses: {
    200: {
      description: 'recieve all pending users',
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
