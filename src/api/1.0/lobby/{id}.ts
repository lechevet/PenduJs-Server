import { OpenApi, Operation } from 'express-openapi';

import { generateLog, logger } from '../../../helpers/logger.helper';
import { gameService } from '../../../services/1.x/game.service';

const getParameters: OpenApi.Parameters =  [
  {
    name: 'id',
    in: 'path',
    type: 'string',
    required: true,
    description: 'lobby id.'
  }
];

export const get: Operation = async function(req: any, res: any, next: any): Promise<void> {
  try {
    const lobby = await gameService.getLobby(req.params.id);
    logger.info(generateLog({
      method: req.method,
      url: req.url,
      lobbyDbId: req.user.email_address || 'unknown',
      responseStatus: 200,
      responseMessage: `Lobby with id: ${req.params.id} successfully sent.`
    }));
    res.status(200).json(lobby);
  } catch (error) {
    next(error);
  }
};

get.apiDoc = {
  summary: 'Returns information about a specific lobby.',
  operationId: 'getLobby',
  tags: ['Game', 'GET'],
  parameters: getParameters,
  responses: {
    200: {
      description: 'Lobby information.',
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
