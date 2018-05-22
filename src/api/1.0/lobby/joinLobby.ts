import { Operation } from 'express-openapi';
import { generateLog, logger } from '../../../helpers/logger.helper';
import { gameService } from '../../../services/1.x/game.service';

export const put: Operation = async function(req: any, res: any, next: any): Promise<void> {
    try {
      const result: any = await gameService.addUserToLobby(req.body);
      logger.info(generateLog({
        responseStatus: 201,
        responseMessage: `User successfully added in lobby.`
      }));
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
};

put.apiDoc = {
  summary: 'Add a player to a lobby',
  operationId: 'addUserToLobby',
  tags: ['Game'],
  parameters: [
    {
      name: 'parameters',
      in: 'body',
      schema: {
        type: 'object',
        required: ['idLobby', 'idPlayer'],
        properties: {
          idLobby: {
          type: 'string'
          },
          idPlayer: {
            type: 'string',
          }
        }
      },
      required: true,
      description: 'Add a player to current lobby'
    }
  ],
  responses: {
    200: {
      description: 'Player added',
      schema: {
        type: 'boolean'
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
