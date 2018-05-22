import { Operation } from 'express-openapi';
import { generateLog, logger } from '../../../helpers/logger.helper';
import { gameService } from '../../../services/1.x/game.service';

export const del: Operation = async function(req: any, res: any, next: any): Promise<void> {
    try {
      const result: any = await gameService.delUserFromLobby(req.body);
      logger.info(generateLog({
        responseStatus: 201,
        responseMessage: `User successfully deleted from lobby.`
      }));
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
};

del.apiDoc = {
  summary: 'Delete a player from a lobby',
  operationId: 'delUserFromLobby',
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
      description: 'Delete a player from a lobby'
    }
  ],
  responses: {
    200: {
      description: 'Player deleted',
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
