import { expect } from 'chai';
import * as chai from 'chai';
import * as rewire from 'rewire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as mongo from 'mongodb';
import { config } from '../../../../config';
import { MongoError } from '../../../../models/errors/MongoError';

chai.use(sinonChai);

const usersService = rewire('../../../../services/1.x/user.service');

const userServiceFunctions = usersService.usersService;

describe('users service', function (): void {
  describe('#getUser', function (): void {
    it('should return an error if one occurs on \'findOne\' request', async function (): Promise<void> {
      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async findOne(): Promise<Error> {
          const err = new Error('Error finding user');
          throw new MongoError(err);
        }
      });

      try {
        await userServiceFunctions.getUser('1234567890abcdef12345678');
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Error finding user');
        await revertMongoHelper();
      }
    });

    it('should return an error if a generic error occurs on \'findOne\' request', async function (): Promise<void> {
      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async findOne(): Promise<Error> {
          throw new Error('Error finding user');
        }
      });

      try {
        await userServiceFunctions.getUser('1234567890abcdef12345678');
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Error finding user');
        await revertMongoHelper();
      }
    });

    it('should return the result of \'findOne\'', async function (): Promise<void> {
      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async findOne(): Promise<object> {
          return ({
            foo: 'bar'
          });
        }
      });

      const result = await userServiceFunctions.getUser('1234567890abcdef12345678');
      expect(result).to.deep.equal({
        foo: 'bar'
      });
      await revertMongoHelper();
    });

    it('should call the findOne function with correct parameters', async function (): Promise<void> {
      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      const spy3 = sinon.spy();
      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async findOne(collection: any, query: any, fields: any): Promise<object> {
          await spy1(collection);
          await spy2(query);
          await spy3(fields);
          return {
            foo: 'bar'
          };
        }
      });
      const userId = '1234567890abcdef12345678';

      await userServiceFunctions.getUser(userId);
      expect(spy1.firstCall.args[0]).to.equal(
        config.database.mongoDB.users_collection
      );
      expect(spy2.firstCall.args[0]).to.deep.equal({
        _id: new mongo.ObjectId(userId)
      });
      expect(spy3.firstCall.args[0]).to.deep.equal({
        fields: {
          password: 0,
          // created_at: 0,
          updated_at: 0,
          deleted_at: 0
        }
      });
      await revertMongoHelper();
    });
  });

  describe('#getUsers', function (): void {
    it('should return an error if one occurs on "find" request when calling toArray',
      async function (): Promise<void> {
      const mongoCursor = {
        toArray(): Promise<Error> {
          const err = new Error('Error finding users');
          throw new MongoError(err);
        }
      };

      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async find(): Promise<any> {
          return await mongoCursor;
        }
      });

      try {
        await userServiceFunctions.getUsers({
          query: {}
        });
      } catch (error) {
        expect(error).to.not.equal(false);
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Error finding users');
        await revertMongoHelper();
      }
    });

    it('should get all the correct call if all options are present', async function (): Promise<void> {
      const spyCollection = sinon.spy();
      const spyQuery = sinon.spy();
      const spyParams = sinon.spy();
      const mongoCursor = await {
        async toArray(): Promise<object[]> {
          return [
            {foo: 'bar'},
            {bar: 'foo'}
          ];
        }
      };

      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async find(collection: any, query: any, params: any): Promise<any> {
          spyCollection(collection);
          spyQuery(query);
          spyParams(params);
          return await mongoCursor;
        }
      });

      await userServiceFunctions.getUsers({
        firstName: 'John',
        lastName: 'Doe',
        offset: 25,
        limit: 0,
        sort: 'lastName',
        order: -1,
        fields: ['firstName', 'lastName']
      });
      expect(spyCollection.firstCall.args[0]).to.equal(
        config.database.mongoDB.users_collection
      );
      expect(spyQuery.firstCall.args[0]).to.deep.equal({
        firstName: 'John',
        lastName: 'Doe',
        status: 'valid'
      });
      expect(spyParams.firstCall.args[0]).to.deep.equal(
        {
          firstName: 'John',
          lastName: 'Doe',
          offset: 25,
          limit: 0,
          sort: 'lastName',
          order: -1,
          fields: ['firstName', 'lastName']
        }
      );
      await revertMongoHelper();
    });

    it('should set the search for the role', async function (): Promise<void> {
      const spyCollection = sinon.spy();
      const spyQuery = sinon.spy();
      const mongoCursor = {
        async toArray(): Promise<object[]> {
          return [];
        }
      };

      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async find(collection: any, query: any): Promise<any> {
          spyCollection(collection);
          spyQuery(query);
          return await mongoCursor;
        }
      });

      await userServiceFunctions.getUsers({
        role_title: 'asa',
        status: 'valid'
      });
      expect(spyCollection.firstCall.args[0]).to.equal(
        config.database.mongoDB.users_collection
      );
      expect(spyQuery.firstCall.args[0]).to.deep.equal({
        role: 'asa',
        status: 'valid'
      });

      await revertMongoHelper();
    });

    it('should remove the password of each user, even with the "password" field', async function (): Promise<void> {
      const mongoCursor = {
        async toArray(): Promise<object[]> {
          return [
            {
              foo: 'bar',
              test_key: 'key',
              password: 'secret'
            },
            {
              bar: 'foo',
              test_key: 'key',
              password: 'secret'
            }
          ];
        }
      };

      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async find(): Promise<any> {
          return await mongoCursor;
        }
      });

      const result = await userServiceFunctions.getUsers({
        fields: [
          'foo',
          'bar',
          'test_key',
          'password'
        ]
      });
      expect(result[0]).to.deep.equal({
        foo: 'bar',
        test_key: 'key'
      });
      expect(result[1]).to.deep.equal({
        bar: 'foo',
        test_key: 'key'
      });
      await revertMongoHelper();
    });

  });

  describe('#setPushToken', () => {
    it('should throw an error if no token is sent', async () => {
      try {
        await userServiceFunctions.setPushToken();
        expect(true).to.equal(false, 'An error should have been thrown, as a Firebase token should be specified' +
          ' in order to be saved in the database');
      } catch (e) {
        expect(e).to.not.equal(null);
        expect(e.errorCode).to.equal(40103); // WrongCredentialError
        expect(e.errorMessage).to.equal('Authentication error: Invalid push token');
        expect(e.statusCode).to.equal(401);
      }
    });

    it('should throw an error if the token is not a string', async () => {
      try {
        await userServiceFunctions.setPushToken(1000);
        expect(true).to.equal(false, 'An error should have been thrown, as a string token should be specified' +
          ' in order to be saved in the database');
      } catch (e) {
        expect(e).to.not.equal(null);
        expect(e.errorCode).to.equal(40103); // WrongCredentialError
        expect(e.errorMessage).to.equal('Authentication error: Invalid push token');
        expect(e.statusCode).to.equal(401);
      }
    });

    it('should throw an error if the token contains less than 3 points', async () => {
      try {
        await userServiceFunctions.setPushToken('less.points');
        expect(true).to.equal(false, 'An error should have been thrown, as a Firebase-formatted token should be ' +
          'specified in order to be saved in the database');
      } catch (e) {
        expect(e).to.not.equal(null);
        expect(e.errorCode).to.equal(40103); // WrongCredentialError
        expect(e.errorMessage).to.equal('Authentication error: Invalid push token');
        expect(e.statusCode).to.equal(401);
      }
    });

    it('should throw an error if the token contains more than 3 points', async () => {
      try {
        await userServiceFunctions.setPushToken('more.than.three.points');
        expect(true).to.equal(false, 'An error should have been thrown, as a Firebase-formatted token should be ' +
          'specified in order to be saved in the database');
      } catch (e) {
        expect(e).to.not.equal(null);
        expect(e.errorCode).to.equal(40103); // WrongCredentialError
        expect(e.errorMessage).to.equal('Authentication error: Invalid push token');
        expect(e.statusCode).to.equal(401);
      }
    });

    it('should throw an error if the user\'s service number isn\'t linked to any DB user',
      async function (): Promise<void> {
        // An empty object will be sent for the request that checks the JWT id <=> DB users link
        const mongoCursor = {
          async toArray(): Promise<any> {
            return await {};
          }
        };

        const revertMongoHelper = usersService.__set__('mongoHelper', {
          async find(): Promise<any> {
            return await mongoCursor;
          }
        });

        try {
          await userServiceFunctions.setPushToken('valid.push.token', 1000);
        } catch (error) {
          expect(error).to.not.equal(false);
          expect(error.errorCode).to.equal(40103);  // WrongCredentialError
          expect(error.errorDetails).to.deep.equal({});
          expect(error.statusCode).to.equal(401);
          expect(error.errorMessage).to.equal('Authentication error: Invalid JWT user id');
          await revertMongoHelper();
        }
      });

    it('should call the update functions with correct parameters', async function (): Promise<void> {
      const spyUpdateMany = sinon.spy();
      const spyUpdateOne = sinon.spy();
      const mongoCursor = {
        async toArray(): Promise<any> {
          return [{
            email_address: 1000
          }];
        }
      };

      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async updateMany(collection: string, filter: any, update?: any): Promise<any> {
          spyUpdateMany(collection, filter, update);
          return;
        },
        async find(): Promise<any> {
          return await mongoCursor;
        },
        async updateOne(collection: string, filter: any, update?: any): Promise<any> {
          spyUpdateOne(collection, filter, update);
          return;
        }
      });

      await userServiceFunctions.setPushToken('valid.push.token', 1000);
      expect(spyUpdateMany.callCount).to.equal(1);
      expect(spyUpdateMany.firstCall.args[0]).to.equal(config.database.mongoDB.users_collection);
      expect(spyUpdateMany.firstCall.args[1]).to.deep.equal(
        {
          push_token: {
            $eq: 'valid.push.token'
          }
        });
      expect(spyUpdateMany.firstCall.args[2]).to.deep.equal(
        {
          $set: {
            push_token: null
          }
        });
      expect(spyUpdateOne.callCount).to.equal(1);
      expect(spyUpdateOne.firstCall.args[0]).to.equal(config.database.mongoDB.users_collection);
      expect(spyUpdateOne.firstCall.args[1]).to.deep.equal(
        {
          email_address: 1000
        });
      expect(spyUpdateOne.firstCall.args[2]).to.deep.equal(
        {
          $set: {
            push_token: 'valid.push.token'
          }
        });
      await revertMongoHelper();
    });
  });

  describe('#removePushToken', () => {
    it('should throw an error if the user\'s service number isn\'t linked to any DB user',
      async function (): Promise<void> {
        // An empty object will be sent for the request that checks the JWT id <=> DB users link
        const mongoCursor = {
          async toArray(): Promise<any> {
            return await {};
          }
        };

        const revertMongoHelper = usersService.__set__('mongoHelper', {
          async find(): Promise<any> {
            return await mongoCursor;
          }
        });

        try {
          await userServiceFunctions.removePushToken(1000);
        } catch (error) {
          expect(error).to.not.equal(false);
          expect(error.errorCode).to.equal(40103);  // WrongCredentialError
          expect(error.errorDetails).to.deep.equal({});
          expect(error.statusCode).to.equal(401);
          expect(error.errorMessage).to.equal('Authentication error: Invalid JWT user id');
          await revertMongoHelper();
        }
      });

    it('should call the updateMany function with correct parameters', async function (): Promise<void> {
      const spyUpdateMany = sinon.spy();
      const mongoCursor = {
        async toArray(): Promise<any> {
          return [{
            email_address: 1000,
            push_token: 'TOKEN'
          }];
        }
      };

      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async updateMany(collection: string, filter: any, update?: any): Promise<any> {
          spyUpdateMany(collection, filter, update);
          return;
        },
        async find(): Promise<any> {
          return await mongoCursor;
        }
      });

      await userServiceFunctions.removePushToken(1000);
      expect(spyUpdateMany.callCount).to.equal(1);
      expect(spyUpdateMany.firstCall.args[0]).to.equal(config.database.mongoDB.users_collection);
      expect(spyUpdateMany.firstCall.args[1]).to.deep.equal(
        {
          push_token: {
            $eq: 'TOKEN'
          }
        });
      expect(spyUpdateMany.firstCall.args[2]).to.deep.equal(
        {
          $set: {
            push_token: null
          }
        });
      await revertMongoHelper();
    });

    it('should not throw any error if the logged user doesn\'t have any token', async function (): Promise<void> {
      const spyUpdateMany = sinon.spy();
      const mongoCursor = {
        async toArray(): Promise<any> {
          return [{
            email_address: 1000 // No push token
          }];
        }
      };

      const revertMongoHelper = usersService.__set__('mongoHelper', {
        async updateMany(collection: string, filter: any, update?: any): Promise<any> {
          spyUpdateMany(collection, filter, update);
          return;
        },
        async find(): Promise<any> {
          return await mongoCursor;
        }
      });

      await userServiceFunctions.removePushToken(1000);
      expect(spyUpdateMany.callCount).to.equal(0);
      await revertMongoHelper();
    });
  });
});
