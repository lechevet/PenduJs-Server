import { config } from '../../config';
import { MongoHelper } from '../../helpers/mongo.helper';
import { MongoError } from '../../models/errors/MongoError';
import { InvalidParametersError } from '../../models/errors/InvalidParametersError';
import { NotFoundError } from '../../models/errors/NotFoundError';
import { logger } from '../../helpers/logger.helper';
import * as moment from 'moment';
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
                    _id: ID,
                    status: 'valid'
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

    // Safe delete (add "deleted_at": timestamp) the lobby
    async deleteLobby(id: string): Promise<void> {
        const ID = new mongo.ObjectId(id);
        try {
            return await mongoHelper.deleteOne(
                config.database.mongoDB.lobbies_collection,
                {
                    _id: ID
                },
                {},
                false
            );
        } catch (error) {
            throw new NotFoundError(error);
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
        // if (results.length === 0) {
        //   const error = new Error('There is no valid lobby');
        //   throw new NotFoundError(error);
        // }
        return results;
    },

    // Create a empty lobby
    async createLobby(parameters: {
        name?: string
    }): Promise<any> {
        // prepare the final query
        const newLobby = {
            name: parameters.name,
            status: 'valid',
            players: []
        };
        // execute the query
        try {
            await mongoHelper.insertOne(
                config.database.mongoDB.lobbies_collection,
                newLobby
            );
            return newLobby;
        } catch (error) {
            logger.error(error);
            const newError = new Error('Mongo Error createLobby');
            throw new InvalidParametersError(newError);
        }
    },

    async addUserToLobby(parameters: {
        idLobby: string,
        idPlayer: string
    }): Promise<boolean> {
        const ID = new mongo.ObjectId(parameters.idLobby);
        try {
            const result = await mongoHelper.updateOne(
                config.database.mongoDB.lobbies_collection,
                {
                    _id: ID
                },
                {
                    $push: {
                        players: {
                            player: parameters.idPlayer,
                            timestamp: moment().toISOString(),
                        }
                    }
                }
            );
            return !!(result.result.nModified && result.result.ok);
        } catch (error) {
            logger.error(error);
            const newError = new Error('Mongo Error addUserToLobby');
            throw new MongoError(newError);
        }
    },

    async delUserFromLobby(parameters: {
        idLobby: string,
        idPlayer: string
    }): Promise<boolean> {
        const ID = new mongo.ObjectId(parameters.idLobby);
        try {
            const result = await mongoHelper.updateOne(
                config.database.mongoDB.lobbies_collection,
                {
                    _id: ID
                },
                {
                    $pull: {
                        players: {
                            player: parameters.idPlayer,
                        }
                    }
                }
            );

        // Check s'il reste des users dans le lobby, sinon delete le lobby
        const lobby = await mongoHelper.findOne(
            config.database.mongoDB.lobbies_collection,
            {
                _id: ID,
                status: 'valid'
            },
            {
                fields: {
                    // created_at: 0,
                    updated_at: 0,
                    deleted_at: 0
                }
            }
        );
        if (lobby.players.toString() === '') {
            console.log(lobby.players);
            console.log('il faut delete le lobby');
            await this.deleteLobby(parameters.idLobby);
        }
            return !!(result.result.nModified && result.result.ok);
        } catch (error) {
            logger.error(error);
            const newError = new Error('Mongo Error delUserFromLobby');
            throw new MongoError(newError);
        }
    },

    // Create and start a lobby
    async initLobby(parameters: {
        name: string
    }): Promise<object> {
        const result = await this.createLobby(parameters);

        // await this.startMatch();

        return result;
    },
};

