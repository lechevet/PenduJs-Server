import { expect } from 'chai';
import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as request from 'supertest';
import { app } from '../../../app';
import { config } from '../../../config';
import { MongoHelper } from '../../../helpers/mongo.helper';
import { checkStarted } from '../../../tests/init';
import { DB } from '../../../helpers/init/mongo-init.helper';
import * as jwt from 'jsonwebtoken';
import * as path from 'path' ;

describe("/login", () => {
  before(function (done: any): void {
    checkStarted(async () => {
      // Once the app is initialized, clear the DB (which should be a test one)
      await DB.collection(config.database.mongoDB.users_collection).deleteMany({});

      // Create a new user for all the tests
      // First, create the password in order to create the user
      const salt = 'salt';
      const iterations = 12345;
      const algorithm = 'sha512';
      const hashLength = 64;
      const password = 'test';
      const pbkdf2 = promisify(crypto.pbkdf2);
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const hashedCredentials = await pbkdf2(hashedPassword, salt, iterations, hashLength, algorithm);

      const mongoHelper = new MongoHelper();
      await mongoHelper.insertMany(
        config.database.mongoDB.users_collection,
        [
          {
            userName: 'userName',
            email_address: config.users.default.admin.login,
            role: 'Administrator',
            password: {
              salt,
              iterations,
              algorithm,
              length: hashLength,
              hash: hashedCredentials.toString('hex')
            },
            status: 'valid'
          },
          {
            userName: 'userName',
            email_address: 'user@amiltone.com',
            role: 'SimpleUser',
            password: {
              salt,
              iterations,
              algorithm,
              length: hashLength,
              hash: hashedCredentials.toString('hex')
            },
            status: 'pending'
          }
        ]
      );
      // And start the next tests
      done();
    });
  });
  describe("POST", () => {
    it("should return a code 200 when login", async function(): Promise<void> {
      await request(app)
        .post(path.join(config.application.api.basePath, "/auth/login"))
        .send({
          login: config.users.default.admin.login,
          password: "test"
        })
        .expect(200)
        .expect((res) => {
          expect(res.error).to.equal(false);
          expect(res.body.user).to.not.equal(null);
          expect(res.body.user.userName).to.equal('userName');
          expect(res.body.user.email_address).to.equal(config.users.default.admin.login);
          expect(res.body.user.role).to.equal('Administrator');
          // And finally, check the JWT existence and validity
          expect(res.body.token).to.not.equal(null);
          const userJwt = res.body.token;
          const decodedJwt = jwt.verify(userJwt, config.application.jwt.secret);
          expect(decodedJwt.email_address).to.equal(res.body.user.email_address);
          expect(decodedJwt.role).to.equal(res.body.user.role);
        });
    });

    it('should throw an error if no login wasn\'t set', async function(): Promise<void> {
      await request(app)
        .post(path.join(config.application.api.basePath, '/auth/login'))
        .send({
          password: 'test'
        })
        .expect(400)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal('cannot POST /api/1.0/auth/login (400)');
          const expectedError = {
            errors: [
                {
                  errorCode: "required.openapi.validation",
                  location: "body",
                  message: "instance requires property \"login\"",
                  path: "login"
                }
              ],
              status: 400
          };
          expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
        });
    });

    it('should throw an error if domain name is not amiltone.com or amiltone.fr', async function(): Promise<void> {
      await  request(app)
        .post(path.join(config.application.api.basePath, '/auth/login'))
        .send({
          login: 'admin@domain.com',
          password: 'test'
        })
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal('cannot POST /api/1.0/auth/login (401)');
          const expectedError = {
            errorDetails: {},
            errorCode: 40103,
            statusCode: 401,
            errorMessage: 'Authentication error: Wrong credentials'
          };
          expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
        });
    });

    it("should throw an error if user doesn't exist", async function(): Promise<void> {
      await request(app)
        .post(path.join(config.application.api.basePath, "/auth/login"))
        .send({
          login: "fake@amiltone.com",
          password: "test"
        })
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal('cannot POST /api/1.0/auth/login (401)');
          const expectedError = {
            errorDetails: {},
            errorCode: 40103,
            statusCode: 401,
            errorMessage: 'Authentication error: Non existant credential'
          };
          expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
        });
    });

    it("should throw an error if the password is incorrect", async function(): Promise<void> {
      await request(app)
        .post(path.join(config.application.api.basePath, "/auth/login"))
        .send({
          login: config.users.default.admin.login,
          password: "gfngfcjgfc"
        })
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal('cannot POST /api/1.0/auth/login (401)');
          const expectedError = {
            errorDetails: {},
            errorCode: 40103,
            statusCode: 401,
            errorMessage: 'Authentication error: Wrong credentials'
          };
          expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
        });
    });

    it("should throw an error if a parameter is missing", async function(): Promise<void> {
      await request(app)
      .post(path.join(config.application.api.basePath, "/auth/login"))
      .send({
        login: config.users.default.admin.login
      })
      .expect(400)
      .expect((res) => {
        expect(res.error).to.not.equal(null);
        expect(res.error.message).to.equal('cannot POST /api/1.0/auth/login (400)');
        const expectedError = {
          status: 400,
          errors: [
            {
              errorCode: 'required.openapi.validation',
              location: 'body',
              message: 'instance requires property \"password\"',
              path: 'password'
            }
          ]
        };
        expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
      });
    });

    it("should throw an error if there is too much parameters", async function(): Promise<void> {
      await request(app)
      .post(path.join(config.application.api.basePath, "/auth/login"))
      .send({
        login: config.users.default.admin.login,
        password: "test",
        toomuch: 0
      })
      .expect(400)
      .expect((res) => {
        expect(res.error).to.not.equal(null);
        expect(res.error.message).to.equal('cannot POST /api/1.0/auth/login (400)');
        const expectedError = {
          errorCode: 40005,
          errorMessage: "Bad request: Some specified parameters aren't specified in the API Doc",
          errorDetails: {
            invalidParameters: [
              "toomuch"
            ]
          },
          statusCode: 400
        };
        expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
      });
    });

    it("should throw an error if a parameter is an invalid type", async function(): Promise<void> {
      await request(app)
      .post(path.join(config.application.api.basePath, "/auth/login"))
      .send({
        login: config.users.default.admin.login,
        password: 0
      })
      .expect(400)
      .expect((res) => {
        expect(res.error).to.not.equal(null);
        expect(res.error.message).to.equal('cannot POST /api/1.0/auth/login (400)');
        const expectedError = {
          status: 400,
          errors: [
            {
              path: "password",
              errorCode: "type.openapi.validation",
              message: "instance.password is not of a type(s) string",
              location: "body"
            }
          ]
        };
        expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
      });
    });

    it("should throw an error the account isn't validated", async function(): Promise<void> {
      await request(app)
        .post(path.join(config.application.api.basePath, "/auth/login"))
        .send({
          login: 'user@amiltone.com',
          password: "test"
        })
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal('cannot POST /api/1.0/auth/login (401)');
          const expectedError = {
            errorDetails: {},
            errorCode: 40103,
            statusCode: 401,
            errorMessage: 'Authentication error: account must be validated.'
          };
          expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
        });
    });

  });
});
