import { Operation } from 'express-openapi';
import { generateLog, logger } from '../../../helpers/logger.helper';
import { usersService } from '../../../services/1.x/user.service';

const getParameters = [
    {
      name: 'email_address',
      in: 'query',
      type: 'string',
      description: 'email of the user.'
    }
  ];

  export const post: Operation = async function (req: any, res: any, next: any): Promise<void> {
    try {
      const emailAddress = req.body.email_address;
      const user: any = await usersService.getUserByEmail(emailAddress);
      await usersService.sendResetLinkPassword(user);
      logger.info(generateLog({
          method: req.method,
          url: req.url,
          userDbId: emailAddress || 'unknown',
          responseStatus: 200,
          responseMessage: 'Request of resetting password successful.'
        }));
        res.status(200).json(user);
      } catch (error) {
        next(error);
      }
};

post.apiDoc = {
    summary: 'Send link to reset user password',
    operationId: 'sendResetLinkPassword',
    tags: [ 'User', 'POST' ],
    parameters: getParameters,
    responses: {
      200: {
        description: 'A link to reset password for an user',
        schema: {
          type: 'string',
          properties: {
            link: {
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
