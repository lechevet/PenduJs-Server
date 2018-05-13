import { OpenApi, Operation } from 'express-openapi';

import { generateLog, logger } from '../../../../helpers/logger.helper';
import { checkPermissionLevel, Permissions } from '../../../../helpers/permissions.helper';
import { authService } from '../../../../services/1.x/auth.service';
import { usersService } from '../../../../services/1.x/user.service';
//import { mailService } from '../../../../services/1.x/mail.service';

const getParameters: OpenApi.Parameters =  [
  {
    name: 'register',
    in: 'path',
    type: 'string',
    required: true,
    description: 'user id.'
  }
];

export const put: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
    checkPermissionLevel(req.user, [ Permissions.VALIDATE_REGISTER ]);
    await authService.validateRegister(req.params.register);
    const user: any = await usersService.getUser(req.params.register);
    // await mailService.sendValidateMail(user.email_address);
    logger.info(generateLog({
      method: req.method,
      url: req.url,
      userDbId: req.user.email_address || 'unknown',
      responseStatus: 200,
      responseMessage: `New register with id: ${req.params.register} successfully validate.`
    }));
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

put.apiDoc = {
  summary: 'Validate a new register.',
  operationId: 'validateRegister',
  tags: ['Auth', 'PUT'],
  parameters: getParameters,
  responses: {
    200: {
      description: 'Validate register.'
    },
    default: {
      description: 'An error occurred',
      schema: {
        $ref: '#/definitions/Error'
      }
    }
  }
};
