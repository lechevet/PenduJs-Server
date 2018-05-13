import { OpenApi, Operation } from 'express-openapi';

import { generateLog, logger } from '../../../../helpers/logger.helper';
import { gameService } from '../../../../services/1.x/game.service';

const getParameters: OpenApi.Parameters = [
  {
    name: 'id',
    in: 'path',
    type: 'string',
    required: true,
    description: 'lobby id.'
  }
];

export const del: Operation = async function (req: any, res: any, next: any): Promise<void> {
  try {
    await gameService.deleteLobby(req.params.id);
    logger.info(generateLog({
      method: req.method,
      url: req.url,
      responseStatus: 200,
      responseMessage: `Lobby with id: ${req.params.id} succesfully deleted.`
    }));
    res.status(200).json();
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

del.apiDoc = {
  summary: 'Safe delete a specific lobby.',
  operationId: 'deleteLobby',
  tags: ['Game'],
  parameters: getParameters,
  responses: {
    200: {
      description: 'User information.',
      schema: {}
    },
    default: {
      description: 'An error occurred',
      schema: {
        $ref: '#/definitions/Error'
      }
    }
  }
};
