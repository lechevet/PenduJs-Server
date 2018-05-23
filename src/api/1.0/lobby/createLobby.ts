import { Operation } from 'express-openapi';
import { generateLog, logger } from '../../../helpers/logger.helper';
import { gameService } from '../../../services/1.x/game.service';

export const post: Operation = async function(req: any, res: any, next: any): Promise<void> {
    try {
      const lobby: any = await gameService.initLobby(req.body);
      logger.info(generateLog({
        responseStatus: 201,
        responseMessage: `Lobby with id: ${lobby._id} successfully initiated.`
      }));
      res.status(201).json(lobby);
    } catch (error) {
      logger.error(error);
      next(error);
    }
};

post.apiDoc = {
  summary: 'Create a lobby for the game to come',
  operationId: 'createLobby',
  tags: ['Game', 'POST'],
  parameters: [
    {
      name: 'credential',
      in: 'body',
      schema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string'
          }
        }
      },
      required: true,
      description: 'Lobby credential'
    }
  ],
  responses: {
    200: {
      description: 'Lobby created',
      schema: {
        type: 'object',
        properties: {
          lobby: {
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
