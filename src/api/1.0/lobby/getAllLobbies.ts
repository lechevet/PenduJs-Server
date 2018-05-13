import { Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { gameService } from '../../../services/1.x/game.service';

export const get: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
      const lobbies = await gameService.getAllLobbies();
      logger.info(generateLog({
        method: req.method,
        url: req.url,
        responseStatus: 200,
        responseMessage: 'Lobbies list sent successfully.'
      }));
      res.status(200).json(lobbies);
  } catch (error) {
    next(error);
  }
};

get.apiDoc = {
  summary: 'return the lobbies',
  operationId: 'getLobbies',
  tags: ['Game', 'GET'],
  responses: {
    200: {
      description: 'receive all lobbies',
      schema: {
        type: 'array',
        items: {
          $ref: '#/definitions/User'
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
