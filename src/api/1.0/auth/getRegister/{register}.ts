import { OpenApi, Operation } from 'express-openapi';

import { generateLog, logger } from '../../../../helpers/logger.helper';
import { checkPermissionLevel, Permissions } from '../../../../helpers/permissions.helper';
import { authService } from '../../../../services/1.x/auth.service';

const getParameters: OpenApi.Parameters =  [
  {
    name: 'register',
    in: 'path',
    type: 'string',
    required: true,
    description: 'register id.'
  }
];

export const get: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
    checkPermissionLevel(req.user, [ Permissions.GET_REGISTERS ]);
    const user = await authService.getRegister(req.params.register);
    logger.info(generateLog({
      method: req.method,
      url: req.url,
      userDbId: req.user.email_address || 'unknown',
      responseStatus: 200,
      responseMessage: `New register with id: ${req.params.register} successfully sent.`
    }));
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

get.apiDoc = {
  summary: 'Returns information about a specific new register.',
  operationId: 'getRegister',
  tags: ['Auth', 'GET'],
  parameters: getParameters,
  responses: {
    200: {
      description: 'New register information.',
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
