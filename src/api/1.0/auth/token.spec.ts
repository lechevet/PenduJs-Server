import { expect } from 'chai';
import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

import { app } from '../../../app';
import { config } from '../../../config';
import { DB } from '../../../helpers/init/mongo-init.helper';
import { MongoHelper } from '../../../helpers/mongo.helper';
import { checkStarted } from '../../../tests/init';
import * as path from 'path' ;

describe('/auth/tokens', () => {
  let adminUserJwt: string;
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
          status: 'valid'
        }
      );
        // Then we get the Admin user token
      await request(app)
      .post(path.join(config.application.api.basePath, '/auth/login'))
      .send({
        login: config.users.default.admin.login,
        password: 'test'
      })
      .expect(200)
      .expect((res) => {
        adminUserJwt = res.body.token;
      });

      // And start the next tests
      done();
    });
  });

  describe("DELETE", () => {
    it('should throw 401 if the token is not present',
    async function (): Promise<void> {
      await request(app)
        .delete(path.join(config.application.api.basePath, '/auth/token'))
        .send()
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.body.token).to.not.equal(null);
          expect(res.error.message).to.equal('cannot DELETE /api/1.0/auth/token (401)');
        });
    });

    it('should throw 401 if the user\'s JWT doesn\'t contain a valid email_address',
    async function (): Promise<void> {
      const signedJwt = await jwt.sign(
        {
          email_address: 'invalid email_address',
          role: 'SimpleUser'
        },
        config.application.jwt.secret,
        {
          expiresIn: '5s'
        }
      );
      await request(app)
        .delete(path.join(config.application.api.basePath, '/auth/token'))
        .set('Authorization', 'Bearer ' + signedJwt)
        .send()
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal('cannot DELETE /api/1.0/auth/token (401)');
          expect(res.error.text).to.not.equal(null);
          expect(JSON.parse(res.error.text)).to.deep.equal({
            errorCode: 40103,
            errorMessage: 'Authentication error: Invalid JWT user id',
            errorDetails: {},
            statusCode: 401
          });
        });
    });

      it('should throw 401 if the user\'s JWT doesn\'t contain a valid email_address',
      async function (): Promise<void> {
        const signedJwt = await jwt.sign(
          {
            email_address: 'invalid email_address',
            role: 'SimpleUser'
          },
          config.application.jwt.secret,
          {
            expiresIn: '5s'
          }
        );
        await request(app)
          .delete(path.join(config.application.api.basePath, '/auth/token'))
          .set('Authorization', 'Bearer ' + signedJwt)
          .send()
          .expect(401)
          .expect((res) => {
            expect(res.error).to.not.equal(null);
            expect(res.error.message).to.equal('cannot DELETE /api/1.0/auth/token (401)');
            expect(res.error.text).to.not.equal(null);
            expect(JSON.parse(res.error.text)).to.deep.equal({
              errorCode: 40103,
              errorMessage: 'Authentication error: Invalid JWT user id',
              errorDetails: {},
              statusCode: 401
            });
          });
      });


      it('should delete the user push_token if everything is valid',
      async function(): Promise<void> {

        // --- First, set the admin push token --- //

        await request(app)
          .put(path.join(config.application.api.basePath, '/auth/token/new.Push.Token'))
          .set('Authorization', 'Bearer ' + adminUserJwt)
          .send()
          .expect(200)
          .expect((res) => {
            expect(res).to.not.equal(null);
            expect(res.body).to.not.equal(null);
            expect(res.body.n).to.equal(1);
            expect(res.body.nModified).to.equal(1);
            expect(res.body.ok).to.equal(1);
          });

        // Check that the admin's token is created
        const adminUser = await mongoHelper.findOne(
          config.database.mongoDB.users_collection,
          {
            email_address: config.users.default.admin.login
          },
          {
            fields: {
            }
          }
        );
        expect(adminUser).to.not.equal(null);
        expect(adminUser.push_token).to.equal('new.Push.Token');

        // --- Then, delete the admin push token --- //

        await request(app)
          .delete(path.join(config.application.api.basePath, '/auth/token'))
          .set('Authorization', 'Bearer ' + adminUserJwt)
          .send()
          .expect(200)
          .expect((res) => {
            expect(res).to.not.equal(null);
            expect(res.body).to.not.equal(null);
            expect(res.body).to.deep.equal({});
          });

        // --- Then, check that the admin token was deleted --- //

        // First, check that the admin's token is updated
        const updatedAdminUser = await mongoHelper.findOne(
          config.database.mongoDB.users_collection,
          {
            email_address: config.users.default.admin.login
          },
          {
            fields: {
            }
          }
        );
        expect(updatedAdminUser).to.not.equal(null);
        expect(updatedAdminUser.push_token).to.equal(null);

        // And then check that no other user has this token

        const usersWithTokenCursor = await mongoHelper.find(
          config.database.mongoDB.users_collection,
          {
            push_token: {
              $eq: 'new.Push.Token'
            }
          }
        );
        const usersWithToken = await usersWithTokenCursor.toArray();
        expect(usersWithToken).to.not.equal(null);
        expect(usersWithToken.length).to.equal(0);
      });


  });
});

