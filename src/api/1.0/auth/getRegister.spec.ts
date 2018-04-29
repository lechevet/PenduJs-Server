import { expect } from 'chai';
import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as request from 'supertest';
import { app } from '../../../app';
import { config } from '../../../config';
import { MongoHelper } from '../../../helpers/mongo.helper';
import { checkStarted } from '../../../tests/init';
import { DB } from '../../../helpers/init/mongo-init.helper';
import * as path from 'path' ;

async function newPendingRegister(userLogin: string, userPassword: string): Promise<void> {
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
    );
}

async function login(userLogin: string, userPassword: string, userRole: string, userStatus: string): Promise<string> {
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
        status: userStatus
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

describe("/getRegister", () => {
  before(function (done: any): void {
    checkStarted(async () =>  {
      await DB.collection(config.database.mongoDB.users_collection).deleteMany({});
      done();
    });
  });

  describe('GET', () => {
    it('should throw an error if there is no pending register', async function (): Promise<void> {
      const jwtAdmin = await login(config.users.default.admin.login, 'test', 'Administrator', 'valid');
      await request(app)
        .get(path.join(config.application.api.basePath, '/auth/getRegister'))
        .set('Authorization', `Bearer ${jwtAdmin}`)
        .expect(404)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal(`cannot GET ${config.application.api.basePath}/auth/getRegister (404)`);
          const expectedError = {
            statusCode: 404,
            errorCode: 40401,
            errorMessage: 'Can\'t find the requested information: There is no pending register',
            errorDetails: {}
          };
        expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
        });
    });

    it('should throw a list of the pending register', async function(): Promise<void> {
      const jwtAdmin = await login(config.users.default.admin.login, 'test', 'Administrator', 'valid');
      await newPendingRegister('user@amiltone.com', 'test');
      await request(app)
        .get(path.join(config.application.api.basePath, '/auth/getRegister'))
        .set('Authorization', `Bearer ${jwtAdmin}`)
        .expect(200);
    });

    it('should throw an error if user role is insufficient', async function(): Promise<void> {
      const jwtUser = await login('user1@amiltone.com', 'test', 'SimpleUser', 'valid');
      await request(app)
        .get(path.join(config.application.api.basePath, '/auth/getRegister'))
        .set('Authorization', `Bearer ${jwtUser}`)
        .expect(403)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal(`cannot GET ${config.application.api.basePath}/auth/getRegister (403)`);
          const expectedError = {
            statusCode: 403,
            errorCode: 40302,
            errorMessage: 'You are not authorized to access this information: Insufficient permissions',
            errorDetails: {}
          };
        expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
      });
    });
  });
});
