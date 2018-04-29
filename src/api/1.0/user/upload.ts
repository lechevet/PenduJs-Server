import { Operation } from 'express-openapi';
import { generateLog, logger } from '../../../helpers/logger.helper';
import { usersService } from '../../../services/1.x/user.service';

export const post: Operation = async function (req: any, res: any, next: any): Promise<void> {
  try {

    const userResponse: any = await usersService.UploadImage(req.body.data, req.body.email, req.body.token);
    logger.info(generateLog({
      responseStatus: 201,
      responseMessage: `Img uploaded.`
    }));
    res.status(201).json(userResponse);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

post.apiDoc = {
  summary: 'Upload img',
  operationId: 'UploadImg',
  tags: ['User', 'POST'],
  parameters: [
    {
      name: 'credential',
      in: 'body',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'string'
          },
          email: {
            type: 'string'
          },
          token: {
            type: 'string'
          }
        }
      },
      required: true,
      description: 'Upload img'
    }
  ],
  responses: {
    200: {
      description: 'Img successfully uploaded',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'string'
          },
          email: {
            type: 'string'
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
