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

let jwtAdmin = '';
let idAdmin = '';

async function login(userLogin: string, userPassword: string, userRole: string): Promise<void> {
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
    idAdmin = res.body.user._id;
  });
}

describe('/user/{id}', () => {
  before(function (done: any): void {
    checkStarted(async () => {
      // Once the app is initialized, clear the DB (which should be a test one)
      await DB.collection(config.database.mongoDB.users_collection).deleteMany({});
      // And start the next tests
      done();
    });
  });
  describe('GET', () => {
    it('should throw one user if id is ok', async function(): Promise<void> {
      await login(config.users.default.admin.login, 'test', 'Administrator');
      await request(app)
        .get(path.join(config.application.api.basePath, '/user/', idAdmin))
        .set('Authorization', 'Bearer ' + jwtAdmin)
        .expect(200)
        .expect((res) => {
          expect(res.error).to.equal(false);
          expect(res.body).to.not.equal(null);
          expect(res.body.role).to.equal('Administrator');
          expect(res.body.email_address).to.equal(config.users.default.admin.login);
        });
    });

    it('should throw an error if id isn\'t valid', async function(): Promise<void> {
      await login(config.users.default.admin.login, 'test', 'Administrator');
      await request(app)
        .get(path.join(config.application.api.basePath, '/user/1234567890abcdef12345678'))
        .set('Authorization', 'Bearer ' + jwtAdmin)
        .expect(404)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal(`cannot GET ${config.application.api.basePath}/user/1234567890abcdef12345678 (404)`);
          const jsonError = JSON.parse(res.error.text);
          expect(jsonError).to.deep.equal({
            errorCode: 40401,
            errorDetails: {},
            statusCode: 404,
            errorMessage: 'Can\'t find the requested information: Non existing user'
          });
        });
    });
  });
});
