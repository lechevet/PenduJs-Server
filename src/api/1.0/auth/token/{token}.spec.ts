import { expect } from 'chai';
import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

import { app } from '../../../../app';
import { config } from '../../../../config';
import { DB } from '../../../../helpers/init/mongo-init.helper';
import { MongoHelper } from '../../../../helpers/mongo.helper';
import { checkStarted } from '../../../../tests/init';

describe('/auth/token/{token}', () => {
  let adminUserJwt: string;
  let otherUserJwt: string;
  let mongoHelper: any;


  before(function (done: any): void {
    // First of all, check if the app is initialized
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
        }
      ).then(() => {
        mongoHelper.insertOne(
          config.database.mongoDB.users_collection,
          {
            userName: 'userName2',
            email_address: 'admin2@amiltone.com',
            role: 'Administrator',
            password: {
              salt,
              iterations,
              algorithm,
              length: hashLength,
              hash: hashedCredentials.toString('hex')
            },
            status: 'valid'
          });
      });
        // Then we get the Admin user token
      await request(app)
      .post(config.application.api.basePath + '/auth/login')
      .send({
        login: config.users.default.admin.login,
        password: 'test'
      })
      .expect(200)
      .expect((res) => {
        adminUserJwt = res.body.token;
      });

      await request(app)
      .post(config.application.api.basePath + '/auth/login')
      .send({
        login: 'admin2@amiltone.com',
        password: 'test'
      })
      .expect(200)
      .expect((res) => {
        otherUserJwt = res.body.token;
      });

      done();
    });
  });

describe('PUT', () => {
    it('should throw 401 if the token is not present',
      async function (): Promise<void> {
        await request(app)
          .put(config.application.api.basePath + '/auth/token/a.n.y')
          .send()
          .expect(401)
          .expect((res) => {
            expect(res.error).to.not.equal(null);
            expect(res.error.message).to.equal('cannot PUT /api/1.0/auth/token/a.n.y (401)');
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
        .put(config.application.api.basePath + '/auth/token/a.n.y')
        .set('Authorization', 'Bearer ' + signedJwt)
        .send()
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal('cannot PUT /api/1.0/auth/token/a.n.y (401)');
          expect(res.error.text).to.not.equal(null);
          expect(JSON.parse(res.error.text)).to.deep.equal({
            errorCode: 40103,
            errorMessage: 'Authentication error: Invalid JWT user id',
            errorDetails: {},
            statusCode: 401
          });
        });
    });


      it('should throw 401 if the user\'s push token contain more than 3 point-separated strings',
      async function (): Promise<void> {

      await request(app)
        .put(config.application.api.basePath + '/auth/token/token.de.test.valide')
        .set('Authorization', 'Bearer ' + adminUserJwt)
        .send()
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal('cannot PUT /api/1.0/auth/token/token.de.test.valide (401)');
          expect(res.error.text).to.not.equal(null);
          expect(adminUserJwt.split('.', 3).length).to.equal(3);
          expect(JSON.parse(res.error.text)).to.deep.equal({
            errorCode: 40103,
            errorMessage: 'Authentication error: Invalid push token',
            errorDetails: {},
            statusCode: 401
          });
        });
    });

     it('should throw 401 if the user\'s push token contain less than 3 point-separated strings',
      async function (): Promise<void> {
      await request(app)
        .put(config.application.api.basePath + '/auth/token/less.points')
        .set('Authorization', 'Bearer ' + adminUserJwt)
        .send()
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(adminUserJwt.split('.', 3).length).to.equal(3);
          expect(res.error.message).to.equal('cannot PUT /api/1.0/auth/token/less.points (401)');
          expect(res.error.text).to.not.equal(null);
          expect(JSON.parse(res.error.text)).to.deep.equal({
            errorCode: 40103,
            errorMessage: 'Authentication error: Invalid push token',
            errorDetails: {},
            statusCode: 401
          });
        });
    });

   it('should set the user push_token if everything is valid',
      async function(): Promise<void> {
      // --- First, do the request and check the result --- //

      await request(app)
        .put(config.application.api.basePath + '/auth/token/new.Push.Token')
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

      // --- Then, check that everything went OK in the db --- //

      // First, check that the admin's token is updated
      const adminUser = await mongoHelper.findOne(
        config.database.mongoDB.users_collection,
        {
          email_address: config.users.default.admin.login // The Admin User Service Number
        },
        {
          fields: {
          }
        }
      );
      expect(adminUser).to.not.equal(null);
      expect(adminUser.push_token).to.equal('new.Push.Token');

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
      expect(usersWithToken.length).to.equal(1);
      expect(usersWithToken[0].email_address).to.equal(config.users.default.admin.login);
    });

     it('should remove the push_token duplicates',
      async function(): Promise<void> {

      // --- First, do the request and check the result --- //

      await request(app)
        .put(config.application.api.basePath + '/auth/token/new.Push.Token')
        .set('Authorization', 'Bearer ' + otherUserJwt)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res).to.not.equal(null);
          expect(res.body).to.not.equal(null);
          expect(res.body.n).to.equal(1);
          expect(res.body.nModified).to.equal(1);
          expect(res.body.ok).to.equal(1);
        });

      // --- Then, check that everything went OK in the db --- //

      // First, check that the other user's token is updated
      const adminUser = await mongoHelper.findOne(
        config.database.mongoDB.users_collection,
        {
          email_address: 'admin2@amiltone.com' // The Other User Service Number
        },
        {
          fields: {}
        }
      );
      expect(adminUser).to.not.equal(null);
      expect(adminUser.push_token).to.equal('new.Push.Token');

      // And then check that no other user has this token => The admin user lost its token

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
      expect(usersWithToken.length).to.equal(1);
      expect(usersWithToken[0].email_address).to.equal('admin2@amiltone.com');
    });
  });


});
