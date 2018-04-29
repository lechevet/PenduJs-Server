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

async function login(userLogin: string, userPassword: string, userRole: string): Promise<string> {
    // First, create the password in order to create the user
      const salt = 'salt';
      const iterations = 12345;
      const algorithm = 'sha512';
      const hashLength = 64;
      const password = userPassword;
      const pbkdf2 = promisify(crypto.pbkdf2);
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const hashedCredentials = await pbkdf2(hashedPassword, salt, iterations, hashLength, algorithm);
      const mongoHelper = new MongoHelper();
      await mongoHelper.insertOne(
        config.database.mongoDB.users_collection,
        {
          firstName: 'firstname',
          lastName: 'lastname',
          email_address: userLogin,
          role: userRole,
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
      let jwtAdmin = '';
      await request(app)
        .post(path.join(config.application.api.basePath, '/auth/login'))
        .send({
          login: userLogin,
          password: userPassword
        })
        .expect(res => {
          expect(res.error).to.equal(false);
          expect(res.body).to.not.equal(null);
          expect(res.body.token).to.not.equal(null);
          jwtAdmin = res.body.token;
        });
        return jwtAdmin;
    }


describe("/auth/newpassword", () => {

    before(function (done: any): void {
        checkStarted(async () => {
        // Once the app is initialized, clear the DB (which should be a test one)
        await DB.collection(config.database.mongoDB.users_collection).deleteMany({});
        // And start the next tests
        done();
        });
    });

  describe("POST", () => {

     it('should throw an error if password1 != password2', async function(): Promise<void> {
      const jwtAdmin = await login(config.users.default.admin.login, 'test', 'Administrator');
      await request(app)
        .post(path.join(config.application.api.basePath, '/auth/newpassword'))
        .set('Authorization', `Bearer ${jwtAdmin}`)
        .send({
            token: jwtAdmin,
            password1: 'test2',
            password2: 'test'
          })
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


    it('should throw an error if the password is too short', async function(): Promise<void> {
      const jwtAdmin = await login(config.users.default.admin.login, 'test', 'Administrator');
      await request(app)
        .post(path.join(config.application.api.basePath, '/auth/newpassword'))
        .set('Authorization', `Bearer ${jwtAdmin}`)
        .send({
            token: jwtAdmin,
            password1: 'tes',
            password2: 'tes'
          })
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


    it('should throw an error if parameter is missing', async function(): Promise<void> {
      const jwtAdmin = await login(config.users.default.admin.login, 'test', 'Administrator');
      await request(app)
        .post(path.join(config.application.api.basePath, '/auth/newpassword'))
        .set('Authorization', `Bearer ${jwtAdmin}`)
        .send({
            token: jwtAdmin,
            password1: 'test2'
          })
          .expect((res) => {
            const expectedError = {
              errors: [
                {
                  errorCode: "required.openapi.validation",
                  location: "body",
                  message: "instance requires property \"password2\"",
                  path: "password2"
                }
              ],
              status: 400
            };
            expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
          });

    });

    it('should throw an error if there is too much parameters', async function(): Promise<void> {
      const jwtAdmin = await login(config.users.default.admin.login, 'test', 'Administrator');
      await request(app)
        .post(path.join(config.application.api.basePath, '/auth/newpassword'))
        .set('Authorization', `Bearer ${jwtAdmin}`)
        .send({
            token: jwtAdmin,
            password1: 'test',
            password2: 'test',
            toomuch: 'toomuch'
          })
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
        .post(path.join(config.application.api.basePath, '/auth/newpassword'))
        .set('Authorization', 'Bearer ' + signedJwt)
        .send({
          token: signedJwt,
          password1: 'test',
          password2: 'test'
        })
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.text).to.not.equal(null);
          expect(JSON.parse(res.error.text)).to.deep.equal({
            errorCode: 40103,
            errorMessage: 'Authentication error: Non existant credential',
            errorDetails: {},
            statusCode: 401
          });
        });
    });


  });
});
