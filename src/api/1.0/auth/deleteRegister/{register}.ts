import { OpenApi, Operation } from 'express-openapi';

import { generateLog, logger } from '../../../../helpers/logger.helper';
import { checkPermissionLevel, Permissions } from '../../../../helpers/permissions.helper';
import { authService } from '../../../../services/1.x/auth.service';
import { usersService } from '../../../../services/1.x/user.service';
import { mailService } from '../../../../services/1.x/mail.service';

const getParameters: OpenApi.Parameters =  [
  {
    name: 'register',
    in: 'path',
    type: 'string',
    required: true,
    description: 'register id.'
  }
];

export const del: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
    checkPermissionLevel(req.user, [ Permissions.VALIDATE_REGISTER ]);
    const user: any = await usersService.getUser(req.params.register);
    await mailService.sendDeleteRegisterMail(user.email_address);
    await authService.deleteRegister(req.params.register);
    logger.info(generateLog({
      method: req.method,
      url: req.url,
      userDbId: req.user.email_address || 'unknown',
      responseStatus: 200,
      responseMessage: `New register with id: ${req.params.register} successfully deleted.`
    }));
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

del.apiDoc = {
  summary: 'Delete a new register.',
  operationId: 'deleteRegister',
  tags: ['Auth', 'DELETE'],
  parameters: getParameters,
  responses: {
    200: {
      description: 'Delete a new register.',
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
