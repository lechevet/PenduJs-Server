// import { expect } from 'chai';
// import * as chai from 'chai';
// import * as sinonChai from 'sinon-chai';
// import * as crypto from 'crypto';
// import * as promisify from 'es6-promisify';
// import { MongoHelper } from '../../../../helpers/mongo.helper';
// import { config } from '../../../../config';
// import * as request from 'supertest';
// import { app } from '../../../../app';
// import * as path from 'path' ;

// chai.use(sinonChai);
// let jwtAdmin;

// async function login(userLogin: string, userPassword: string, userRole: string, userStatus: string): Promise<object> {
//   const salt = 'salt';
//   const iterations = 12345;
//   const algorithm = 'sha512';
//   const hashLength = 64;
//   const password = userPassword;
//   const pbkdf2 = promisify(crypto.pbkdf2);
//   const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
//   const hashedCredentials = await pbkdf2(hashedPassword, salt, iterations, hashLength, algorithm);

//   const mongoHelper = new MongoHelper();
//   await mongoHelper.insertOne(
//     config.database.mongoDB.users_collection,
//     {
//       userName: 'userName',
//       lastName: 'lastname',
//       email_address: userLogin,
//       role: userRole,
//       password: {
//         salt,
//         iterations,
//         algorithm,
//         length: hashLength,
//         hash: hashedCredentials.toString('hex')
//       },
//       status: userStatus
//     }
//   );
//   await request(app)
//   .post(path.join(config.application.api.basePath, '/auth/login'))
//   .send({
//     login: userLogin,
//     password: userPassword
//   })
//   .expect(res => {
//     expect(res.error).to.equal(false);
//     expect(res.body).to.not.equal(null);
//     expect(res.body.token).to.not.equal(null);
//     jwtAdmin = res.body.token;
//   });
//   return jwtAdmin;
// }


// describe('mail service', async function(): Promise<void> {


// });
