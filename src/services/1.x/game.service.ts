import { config } from '../../config';
import { MongoHelper } from '../../helpers/mongo.helper';
import { MongoError } from '../../models/errors/MongoError';
import { InvalidParametersError } from '../../models/errors/InvalidParametersError';
import { NotFoundError } from '../../models/errors/NotFoundError';
import { logger } from '../../helpers/logger.helper';
import * as mongo from 'mongodb';

const mongoHelper = new MongoHelper();

export const gameService = {

    // Retourne l'id du match en cours ou en attente ou en configuration
    async getLobby(id: string): Promise<object> {
        const ID = new mongo.ObjectId(id);
        try {
          const lobby = await mongoHelper.findOne(
            config.database.mongoDB.lobbies_collection,
            {
              _id: ID
            },
            {
              fields: {
                // created_at: 0,
                updated_at: 0,
                deleted_at: 0
              }
            }
          );
          if (!lobby) {
            const error = new Error('Non existing lobby');
            throw new NotFoundError(error);
          }
          return lobby;
        } catch (error) {
          if (!error.errorCode) {
            throw new MongoError(error);
          }
          throw error;
        }
      },

    // get all lobbies
    async getAllLobbies(): Promise<object[]> {
        const query: object = {
          status: 'valid'
        };
        /* Cherche s'il y a des nouvelles inscriptions */
        const mongoCursor = mongoHelper.find(
          config.database.mongoDB.lobbies_collection,
          query
        );
        const cursor = await mongoCursor;
    
        /* Renvoie une erreur s'il n'y en a pas */
        let results = await cursor.toArray();
        if (results.length === 0) {
          const error = new Error('There is no valid lobby');
          throw new NotFoundError(error);
        }
        return results;
      },
    
    // Create a empty match
    async createLobby(parameters: {
        lobbyName?: string
    }): Promise<any> {
        // prepare the final query
        const newLobby = {
            name: parameters.lobbyName,
            status: 'valid'
        };
        // execute the query
        try {
            const result = await mongoHelper.insertOne(
                config.database.mongoDB.lobbies_collection,
                newLobby
            );
            return { _id: result.ops[0]._id.toString() };
        } catch (error) {
            logger.error(error);
            const newError = new Error('Mongo Error createLobby');
            throw new InvalidParametersError(newError);
        }
    },

    // async addUserToMatch(parameters: {
    //     idPlayer?: string,
    //     position: string,
    //     equipe: string
    // }): Promise<boolean> {
    //     if (await this.getCurrentMatchID() === null) {
    //         const error = new Error('Non current pending match');
    //         throw new GeneralError(error, NotFoundError.NonExistingGame, errorType.NotFound);
    //     } else {
    //         return await matchHandlerService.addUserToMatch({
    //             matchId: await this.getCurrentMatchID(),
    //             idPlayer: parameters.idPlayer ? parameters.idPlayer : '',
    //             position: parameters.position,
    //             equipe: parameters.equipe
    //         });
    //     }
    // },

    // Start a match 'en attente'
    // async startMatch(): Promise<boolean> {
    //     if (await this.getCurrentMatchID() === null) {
    //         const error = new Error('Non current pending match');
    //         throw new GeneralError(error, NotFoundError.NonExistingGame, errorType.NotFound);
    //     } else {
    //         return await matchHandlerService.startMatch({ matchId: await this.getCurrentMatchID() });
    //     }
    // },

    // Create and start a match
    async initMatch(parameters: {
        lobbyName: string
    }): Promise<object> {
        const result = await this.createLobby(parameters);
        // await matchHandlerService.setReadyMatch(result._id);
        // await this.startMatch();
        return result;
    },


    // async cancelMatch(): Promise<boolean> {
    //     if (await this.getCurrentMatchID() === null) {
    //         const error = new Error('Non current match');
    //         throw new GeneralError(error, NotFoundError.NonExistingGame, errorType.NotFound);
    //     } else {
    //         const result = await matchHandlerService.cancelMatch(await this.getCurrentMatchID());
    //         return result;
    //     }
    // },
};

