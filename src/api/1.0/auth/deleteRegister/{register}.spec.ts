import { expect } from 'chai';
import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as request from 'supertest';
import { app } from '../../../../app';
import { config } from '../../../../config';
import { MongoHelper } from '../../../../helpers/mongo.helper';
import { checkStarted } from '../../../../tests/init';
import { DB } from '../../../../helpers/init/mongo-init.helper';

let jwtAdmin = '';
let idUser = '';

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
    const user = await mongoHelper.findOne(
        config.database.mongoDB.users_collection,
        { email_address: userLogin },
        { fields: {
            created_at: 0,
            updated_at: 0,
            deleted_at: 0
        }}
      );
    idUser = user._id;
}

async function login(userLogin: string, userPassword: string, userRole: string, userStatus: string): Promise<void> {
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
    await request(app)
    .post(config.application.api.basePath + '/auth/login')
    .send({
      login: userLogin,
      password: userPassword
    })
    .expect(res => {
      expect(res.error).to.equal(false);
      expect(res.body).to.not.equal(null);
      expect(res.body.token).to.not.equal(null);
      jwtAdmin = res.body.token;
      idUser = res.body.user._id;
    });
  }

describe('/deleteRegister/{register}', () => {
    before(function(done: any): void {
        checkStarted(async () => {
            await DB.collection(config.database.mongoDB.users_collection).deleteMany({});
            done();
        });
    });
    describe('DELETE', () => {
        it('should delete one register', async function(): Promise<void> {
            await login(config.users.default.admin.login, 'test', 'Administrator', 'valid');
            await newPendingRegister('user@amiltone.com', 'test');
            await request(app)
                .del(config.application.api.basePath + '/auth/deleteRegister/' + idUser)
                .set('Authorization', 'Bearer ' + jwtAdmin)
                .expect(200)
                .expect((res) => {
                    expect(res.error).to.equal(false);
                    expect(res.body).to.not.equal(null);
                    expect(res.body.firstName).to.equal('firstname');
                    expect(res.body.lastName).to.equal('lastname');
                    expect(res.body.email_address).to.equal('user@amiltone.com');
                    expect(res.body.role).to.equal('SimpleUser');

                });
        });

        it('should throw an error if there is no pending register', async function(): Promise<void> {
            await request(app)
                .del(config.application.api.basePath + '/auth/deleteRegister/1234567890abcdef12345678')
                .set('Authorization', 'Bearer ' + jwtAdmin)
                .expect(404)
                .expect((res) => {
                    expect(res.error).to.not.equal(null);
                    expect(res.error.message)
                    .to.equal(`cannot DELETE ${config.application.api.basePath}/auth/deleteRegister/1234567890abcdef12345678 (404)`);
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
