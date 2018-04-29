import { expect } from 'chai';
import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as request from 'supertest';

import { app } from '../../../app';
import { config } from '../../../config';
import { DB } from '../../../helpers/init/mongo-init.helper';
import { MongoHelper } from '../../../helpers/mongo.helper';
import { checkStarted } from '../../../tests/init';
import * as path from 'path' ;

describe('/auth/register', () => {

  let mongoHelper: any;
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

      mongoHelper = new MongoHelper();
      await mongoHelper.insertOne(
        config.database.mongoDB.users_collection,
        {
          firstName: 'firstname',
          lastName: 'lastname',
          email_address: config.users.default.admin.login,
          role: 'Administrator',
          password: {
            salt,
            iterations,
            algorithm,
            length: hashLength,
            hash: hashedCredentials.toString('hex')
          },
          status: "valid"
        }
      );

      // And start the next tests
      done();
    });
  });

  describe("PUT", () => {
    it('should throw an error if user already exist', async function(): Promise<void> {
      await request(app)
        .put(path.join(config.application.api.basePath, '/auth/register'))
        .send({
            email_address: config.users.default.admin.login,
            firstName: 'firstname',
            lastName: 'lastname',
            password1: 'test',
            password2: 'test'
          })
          .expect(401)
          .expect((res) => {
            const expectedError = {
              errorCode: 40103,
              errorMessage: "Authentication error: User already exist",
              errorDetails: {},
              statusCode: 401
            };
            expect(res.body.user).to.not.equal(null);
            expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
          });
    });

    it('should throw an error if password1 != password2', async function(): Promise<void> {
      await request(app)
        .put(path.join(config.application.api.basePath, '/auth/register'))
        .send({
            email_address: "admin2@amiltone.com",
            firstName: 'firstname2',
            lastName: 'lastname2',
            password1: 'test1',
            password2: 'test'
          })
          .expect(401)
          .expect((res) => {
            const expectedError = {
              errorCode: 40103,
              errorMessage: "Authentication error: Passwords are differents",
              errorDetails: {},
              statusCode: 401
            };
            expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
          });
    });

    it('should throw an error if password has incorrect format', async function(): Promise<void> {
      await request(app)
        .put(path.join(config.application.api.basePath, '/auth/register'))
        .send({
            email_address: "admin2@amiltone.fr",
            firstName: 'firstname2',
            lastName: 'lastname2',
            password1: 'tes',
            password2: 'tes'
          })
          .expect(401)
          .expect((res) => {
            const expectedError = {
              errorCode: 40103,
              errorMessage: "Authentication error: Password is too short",
              errorDetails: {},
              statusCode: 401
            };
            expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
          });
    });

    it('should throw an error if email address has incorrect format', async function(): Promise<void> {
      await request(app)
        .put(path.join(config.application.api.basePath, '/auth/register'))
        .send({
            email_address: "admin2@test.api",
            firstName: 'firstname2',
            lastName: 'lastname2',
            password1: 'test',
            password2: 'test'
          })
          .expect(401)
          .expect((res) => {
            const expectedError = {
              errorCode: 40103,
              errorMessage: "Authentication error: Email address incorrect format",
              errorDetails: {},
              statusCode: 401
            };
            expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
          });
    });

    it('should throw an error if there is too much parameters', async function(): Promise<void> {
      await request(app)
        .put(path.join(config.application.api.basePath, '/auth/register'))
        .send({
            email_address: config.users.default.admin.login,
            firstName: 'firstname2',
            lastName: 'lastname2',
            password1: 'test',
            password2: 'test',
            toomuch: 0
          })
          .expect(400)
          .expect((res) => {
            const expectedError = {
              errorCode: 40005,
              errorDetails: {
                invalidParameters: [
                  "toomuch"
                ]
              },
              errorMessage: "Bad request: Some specified parameters aren't specified in the API Doc",
              statusCode: 400
            };
            expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
          });
    });

    it('should throw an error if parameter is missing', async function(): Promise<void> {
      await request(app)
        .put(path.join(config.application.api.basePath, '/auth/register'))
        .send({
            email_address: config.users.default.admin.login,
            firstName: 'firstname2',
            password1: 'test',
            password2: 'test'
          })
          .expect(400)
          .expect((res) => {
            const expectedError = {
              errors: [
                {
                  errorCode: "required.openapi.validation",
                  location: "body",
                  message: "instance requires property \"lastName\"",
                  path: "lastName"
                }
              ],
              status: 400
            };
            expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
          });
    });

    it('should register a new user with status "pending"', async function(): Promise<void> {
      await request(app)
        .put(path.join(config.application.api.basePath, '/auth/register'))
        .send({
            email_address: 'user@amiltone.com',
            firstName: 'firstname',
            lastName: 'lastname',
            password1: 'test',
            password2: 'test'
          })
          .expect(201)
          .expect((res) => {
            expect(res.error).to.equal(false);
            expect(res.body).to.not.equal(null);
            expect(res.body.email_address).to.equal('user@amiltone.com');
            expect(res.body.status).to.equal('pending');
          });
    });
  });
});
