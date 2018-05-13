import { Operation } from 'express-openapi';
import { generateLog, logger } from '../../../helpers/logger.helper';
import { usersService } from '../../../services/1.x/user.service';

export const put: Operation = async function(req: any, res: any, next: any): Promise<void> {
    try {
      const userResponse: any = await usersService.userRegister(req.body);
      logger.info(generateLog({
        responseStatus: 201,
        responseMessage: `User with id: ${userResponse.email_address} successfully created.`
      }));
      res.status(201).json(userResponse);
    } catch (error) {
      next(error);
    }
};

put.apiDoc = {
  summary: 'Register user',
  operationId: 'userRegister',
  tags: ['Auth', 'POST'],
  parameters: [
    {
      name: 'credential',
      in: 'body',
      schema: {
        type: 'object',
        required: ['userName', 'email_address', 'password1', 'password2' ],
        properties: {
          userName: {
            type: 'string'
          },
          email_address: {
            type: 'string'
          },
          password1: {
            type: 'string'
          },
          password2: {
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
      description: 'User created',
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
