import { expect } from 'chai';
import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as request from 'supertest';
import { app } from '../../app';
import { config } from '../../config';
import { MongoHelper } from '../../helpers/mongo.helper';
import { checkStarted } from '../../tests/init';
import { DB } from '../../helpers/init/mongo-init.helper';
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
      userName: 'userName',
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


describe("/user", () => {

  before(function (done: any): void {
    checkStarted(async () => {
      // Once the app is initialized, clear the DB (which should be a test one)
      await DB.collection(config.database.mongoDB.users_collection).deleteMany({});
      // And start the next tests
      done();
    });
  });

  describe('GET', () => {
    it('should throw a list of user(s) if all fields are empty', async function(): Promise<void> {
      const jwtAdmin = await login(config.users.default.admin.login, 'test', 'Administrator');
      await request(app)
        .get(path.join(config.application.api.basePath, '/user'))
        .set('Authorization', `Bearer ${jwtAdmin}`)
        .expect(200)
        .expect((res) => {
          expect(res.error).to.equal(false);
          expect(res.body).to.not.equal(null);
        });
    });

    it('should throw an error if no JWT specified', async function(): Promise<void> {
      await request(app)
        .get(path.join(config.application.api.basePath, '/user'))
        .send()
        .expect(401)
        .expect((res) => {
          expect(res.error).to.not.equal(null);
          expect(res.error.message).to.equal(`cannot GET ${config.application.api.basePath}/user (401)`);
          const expectedError = {
            statusCode: 401,
            errorCode: 40105,
            errorMessage: 'Bad request: No authorization token was found',
            errorDetails: {
              code: "credentials_required"
            }
          };
          expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
        });
    });
  });

});
