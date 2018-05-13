import { Operation } from 'express-openapi';
import { generateLog, logger } from '../../../helpers/logger.helper';
import { gameService } from '../../../services/1.x/game.service';

export const post: Operation = async function(req: any, res: any, next: any): Promise<void> {
    try {
      const match: any = await gameService.initMatch(req.body);
      logger.info(generateLog({
        responseStatus: 201,
        responseMessage: `Match with id: ${match._id} successfully initiated.`
      }));
      res.status(201).json(match);
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
        required: ['lobbyName'],
        properties: {
          lobbyName: {
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
