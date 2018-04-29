import { expect } from 'chai';
import * as chai from 'chai';
import * as rewire from 'rewire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as moment from 'moment';


chai.use(sinonChai);

import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import { config } from '../../../../config';

const authService = rewire( '../../../../services/1.x/auth.service');
const authServiceFunctions = authService.authService;


describe('auth service', async function(): Promise<void> {
  describe('#createToken', async function(): Promise<void> {
    it('should return an error if the necessary information are missing', async function(): Promise<void> {
      try {
        await authServiceFunctions.createToken({});
      } catch (error) {
        expect(error).not.to.be.equal(null);
        expect(error.errorCode).to.equal(40104);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(401);
        expect(error.errorMessage).to.equal('Authentication error: Missing information for the token creation');
      }
    });

    it('should return a object with the user and the token as string', async function(): Promise<void> {
      const user = {
        email_address: 'foobar@amiltone.com',
        role: 'asa'
      };

      const result = await authServiceFunctions.createToken(user);
      expect(result).not.to.be.equal(null);
      expect(result.user).to.deep.equal(user);
      expect(typeof result.token).to.equal('string');
    });

    it('should return a token of jwt format', async function(): Promise<void> {
      const user = {
        email_address: 'foobar@amiltone.com',
        role: 'asa'
      };
      const jwtRegex = /^[a-zA-Z0-9\-_]{6,}\.[a-zA-Z0-9\-_]{6,}\.[a-zA-Z0-9\-_]{6,}$/;

      const result = await authServiceFunctions.createToken(user);
      expect(jwtRegex.test(result.token)).to.equal(true);
    });
  });

  describe('#userLogin', async function(): Promise<void> {
    it(`should return the error from the 'mongoHelper.findOne' and not call 'mongoHelper.updateOne'`,
      async function(): Promise<void> {
      const spySuccess = sinon.spy();
      const spyFail = sinon.spy();
      const revertMongoHelper = authService.__set__('mongoHelper', {
        async findOne(_collection: any, _query: any, _update: any): Promise<Error> {
          spySuccess();
          throw new Error ('findOne error');
        },
        async updateOne(_collection: any, _query: any, _update: any): Promise<Error> {
          spyFail();
          throw new Error ('updateOne error');
        }
      });

      try {
        await authServiceFunctions.userLogin({
          login: "@amiltone.com"
        });
      } catch (error) {
        expect(error.message).to.equal('findOne error');
        expect(spySuccess.callCount).to.equal(1);
        expect(spyFail.callCount).to.equal(0);
        await revertMongoHelper();
      }
    });

    it('should call \'mongoHelper.findOne\' with correct value', async function(): Promise<void> {
      const spyCollection = sinon.spy();
      const spyQuery = sinon.spy();
      const spyOptions = sinon.spy();
      const revertMongoHelper = authService.__set__('mongoHelper', {
        async findOne(collection: any, query: any, options: any): Promise<Error> {
          spyCollection(collection);
          spyQuery(query);
          spyOptions(options);
          throw new Error ('findOne error');
        },
        async updateOne(_collection: any, _query: any, _update: any): Promise<Error> {
          throw new Error ('updateOne error');
        }
      });

      try {
        await authServiceFunctions.userLogin({
          login: '12345@amiltone.com',
          password: 'secret'
        });
      } catch (error) {
        expect(spyCollection.firstCall.args[0]).to.equal(
          config.database.mongoDB.users_collection
        );
        expect(spyQuery.firstCall.args[0]).to.deep.equal({
          email_address: '12345@amiltone.com'
        });
        expect(spyOptions.firstCall.args[0]).to.deep.equal({
          fields: {
            created_at: 0,
            updated_at: 0,
            deleted_at: 0
          }
        });
        await revertMongoHelper();
      }
    });

    it('should return an error if no user was found', async function(): Promise<void> {
      const spyFail = sinon.spy();
      const revertMongoHelper = authService.__set__('mongoHelper', {
        async findOne(_collection: any, _query: any, _update: any): Promise<any> {
          return null;
        },
        async updateOne(_collection: any, _query: any, _update: any): Promise<Error> {
          spyFail();
          throw new Error('updateOne error');
        }
      });

      try {
        await authServiceFunctions.userLogin({
          login: '124@amiltone.com',
          password: 'secret'
        });
      } catch (error) {
        expect(error.errorCode).to.equal(40103);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(401);
        expect(error.errorMessage).to.equal('Authentication error: Non existant credential');

        expect(spyFail.callCount).to.equal(0);

        await revertMongoHelper();
      }
    });

    it('should return an error if DB password format is invalid', async function(): Promise<void> {
      // This test will mock an invalid DB password (with missing "iterations" parameter), and expects an error.
      const spyFail = sinon.spy();
      const revertMongoHelper = authService.__set__('mongoHelper', {
        async findOne(_collection: any, _query: any, _update: any): Promise<any> {
          return {
            email_address: 'valid@amiltone.com',
            password: {
              hash: 'valid hash',
              salt: 'valid hash',
              algorithm: 'valid algorithm',
              length: 1
            },
            status: 'valid'
          };
        }
      });

      try {
        await authServiceFunctions.userLogin({
          login: 'test@amiltone.com',
          password: 'secret'
        });
      } catch (error) {
        expect(error.errorCode).to.equal(40103);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(401);
        expect(error.errorMessage).to.equal('Authentication error: Invalid password format');

        expect(spyFail.callCount).to.equal(0);

        await revertMongoHelper();
      }
    });

    it('should throw a pbkdf2 error if password parameter format is invalid', async function(): Promise<void> {
      // This test will mock an invalid DB password (with wrong "iterations" type, as it is expected to be a number),
      // and expects an error thrown by pbkdf2
      const spyFail = sinon.spy();
      const revertMongoHelper = authService.__set__('mongoHelper', {
        async findOne(_collection: any, _query: any, _update: any): Promise<any> {
          return {
            email_address: '52@amiltone.com',
            password: {
              hash: 'valid hash',
              salt: 'valid hash',
              algorithm: 'valid algorithm',
              length: 1,
              iterations: 'string'
            },
            status: 'valid'
          };
        }
      });

      try {
        await authServiceFunctions.userLogin({
          login: '52@amiltone.com',
          password: 'secret'
        });
      } catch (error) {
        expect(error.errorCode).to.equal(40103);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(401);
        expect(error.errorMessage).to.equal('Authentication error: Iterations not a number');

        expect(spyFail.callCount).to.equal(0);

        await revertMongoHelper();
      }
    });

    it('should return the wrongCredential error if the returned user doesn\'t have the correct info',
      async function(): Promise<void> {
        const spyFail = sinon.spy();
        const revertMongoHelper = authService.__set__('mongoHelper', {
          async findOne(_collection: any, _query: any, _update: any): Promise<any> {
            // Mocking the first findOne, where "password" is expected to be an object, specifying a string here
            return {
              email_address: 'valid@amiltone.com',
              password: 'invalid'
            };
          },
          async updateOne(_collection: any, _query: any, _update: any): Promise<Error> {
            spyFail();
            throw new Error('updateOne error');
          }
        });

        try {
          await authServiceFunctions.userLogin({
            login: 'valid@amiltone.com',
            password: 'secret'
          });
        } catch (error) {
          expect(error.errorCode).to.equal(40103);
          expect(error.errorDetails).to.deep.equal({});
          expect(error.statusCode).to.equal(401);
          expect(error.errorMessage).to.equal('Authentication error: Non existant credential');

          expect(spyFail.callCount).to.equal(0);

          await revertMongoHelper();
        }
      });

    it('should call \'mongoHelper.updateOne\' with correct value', async function(): Promise<void> {
      const spyCollection = sinon.spy();
      const spyQuery = sinon.spy();
      const spyUpdate = sinon.spy();
      const startDate = moment();
      const salt = 'salt';
      const iterations = 12345;
      const algorithm = 'sha512';
      const hashLength = 64;
      const password = 'test';
      const pbkdf2 = promisify(crypto.pbkdf2);
      // We use its salt & iteration count in order to hash the credential password the same way its password was
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const hashedCredentials = await pbkdf2(hashedPassword, salt, iterations, hashLength, algorithm);
      const revertMongoHelper = authService.__set__('mongoHelper', {
        async findOne(_collection: any, _query: any, _options: any): Promise<object> {
          return {
            email_address: 'foobar@amiltone.com',
            role: 'asa',
            password: {
              salt,
              iterations,
              length: hashLength,
              algorithm,
              hash: hashedCredentials.toString('hex')
            },
            status: 'valid'
          };
        },
        async updateOne(collection: any, query: any, update: any): Promise<string> {
          spyCollection(collection);
          spyQuery(query);
          spyUpdate(update);
          return 'updateOne error';
        }
      });

      await authServiceFunctions.userLogin({
        login: 'foobar@amiltone.com',
        password: 'test'
      });
      const endDate = moment();
      expect(spyCollection.firstCall.args[0]).to.equal(
        config.database.mongoDB.users_collection
      );
      expect(spyQuery.firstCall.args[0]).to.deep.equal({
        email_address: 'foobar@amiltone.com'
      });

      // the 'last_login' should be between the startDate and endDate
      expect(moment(spyUpdate.firstCall.args[0].$set.last_login).valueOf())
        .to.be.at.least(startDate.valueOf());
      expect(moment(spyUpdate.firstCall.args[0].$set.last_login).valueOf())
        .to.be.at.most(endDate.valueOf());
      await revertMongoHelper();
    });

    it('should resolve with the user info if everything works fine', async function(): Promise<void> {
      const salt = 'salt';
      const iterations = 12345;
      const algorithm = 'sha512';
      const hashLength = 64;
      const password = 'test';
      const pbkdf2 = promisify(crypto.pbkdf2);
      // We use its salt & iteration count in order to hash the credential password the same way its password was
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const hashedCredentials = await pbkdf2(hashedPassword, salt, iterations, hashLength, algorithm);
      const revertMongoHelper = authService.__set__('mongoHelper', {
        async findOne(_collection: any, _query: any, _options: any): Promise<object> {
          return {
            email_address: 'foobar@amiltone.com',
            role: 'asa',
            password: {
              salt,
              iterations,
              algorithm,
              length: hashLength,
              hash: hashedCredentials.toString('hex')
            },
            status: 'valid'
          };
        },
        async updateOne(_collection: any, _query: any, _update: any): Promise<string> {
          return 'updateOne error';
        }
      });

      const result = await authServiceFunctions.userLogin({
        login: 'test@amiltone.com',
        password: 'test'
      });
      expect(result.user).to.deep.equal({
        email_address: 'foobar@amiltone.com',
        role: 'asa',
        status: 'valid'
      });
      expect(typeof result.token).to.equal('string');
      await revertMongoHelper();
    });
  });

});
