// import { expect } from 'chai';
// import * as crypto from 'crypto';
// import * as promisify from 'es6-promisify';
// import * as jwt from 'jsonwebtoken';
// import * as request from 'supertest';

// import { app } from '../../../app';
// import { config } from '../../../config';
// import { MongoHelper } from '../../../helpers/mongo.helper';

// let jwtAdmin = '';

// async function login(userLogin: string, userPassword: string, userRole: string): Promise<string> {
//   // First, create the password in order to create the user
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
//       firstName: 'firstname',
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
//       status: 'valid'
//     }
//   );
//   await request(app)
//     .post(config.application.api.basePath + '/auth/login')
//     .send({
//       login: userLogin,
//       password: userPassword
//     })
//     .expect(res => {
//       expect(res.error).to.equal(false);
//       expect(res.body).to.not.equal(null);
//       expect(res.body.token).to.not.equal(null);
//       jwtAdmin = res.body.token;
//     });
//   return jwtAdmin;
// }


// describe('/user/updateuser', () => {


//   it('should throw an error if there is too much parameters', async function (): Promise<void> {
//     const jwtAdmin = await login(config.users.default.admin.login, 'test', 'SimpleUser');
//     await request(app)
//       .put(config.application.api.basePath + '/user/updateuser')
//       .set('Authorization', `Bearer ${jwtAdmin}`)
//       .send({
//         email_address: config.users.default.admin.login,
//         firstName: 'firstname2',
//         lastName: 'lastname2',
//         toomuch: 'toomuch'
//       })
//       .expect(400)
//       .expect((res) => {
//         const expectedError = {
//           errorCode: 40005,
//           errorDetails: {
//             invalidParameters: [
//               "toomuch"
//             ]
//           },
//           errorMessage: "Bad request: Some specified parameters aren't specified in the API Doc",
//           statusCode: 400
//         };
//         expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
//       });
//   });

//   it('should throw an error if parameter is missing', async function (): Promise<void> {
//     const jwtAdmin = await login(config.users.default.admin.login, 'test', 'SimpleUser');

//     await request(app)
//       .put(config.application.api.basePath + '/user/updateuser')
//       .set('Authorization', `Bearer ${jwtAdmin}`)
//       .send({
//         email_address: config.users.default.admin.login,
//         firstName: 'firstname2'
//       })
//       .expect(400)
//       .expect((res) => {
//         const expectedError = {
//           errors: [
//             {
//               errorCode: "required.openapi.validation",
//               location: "body",
//               message: "instance requires property \"lastName\"",
//               path: "lastName"
//             }
//           ],
//           status: 400
//         };
//         expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
//       });
//   });


//   it("should throw an error if user doesn't exist", async function (): Promise<void> {
//     const jwtAdmin = await login(config.users.default.admin.login, 'test', 'SimpleUser');
//     await request(app)
//       .put(config.application.api.basePath + "/user/updateuser")
//       .set('Authorization', `Bearer ${jwtAdmin}`)
//       .send({
//         email_address: 'fakeuser@amiltone.fr',
//         firstName: 'firstname2',
//         lastName: 'lastname2'
//       })
//       .expect(400)
//       .expect((res) => {
//         expect(res.error).to.not.equal(null);
//         const expectedError = {
//           errorDetails: {},
//           errorCode: 40002,
//           statusCode: 400,
//           errorMessage: "Bad request: Non existing user"
//         };
//         expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
//       });
//   });


//   it("should throw an error if update fail", async function (): Promise<void> {
//     const jwtAdmin = await login(config.users.default.admin.login, 'test', 'SimpleUser');
//     await request(app)
//       .put(config.application.api.basePath + "/user/updateuser")
//       .set('Authorization', `Bearer ${jwtAdmin}`)
//       .send({
//         email_address: config.users.default.admin.login,
//         firstName: 'firstname2',
//         lastName: 'lastname2'
//       })
//       .expect(201)
//       .expect((res) => {
//         const expectedValidation = {
//           n: 1,
//           nModified: 1,
//           ok: 1
//         };
//         expect(JSON.parse(res.text)).to.deep.equal(expectedValidation);
//       });
//   });


// });

// describe("/user/upload", () => {
//   describe('POST', () => {

//     it('should throw an error if parameter is missing', async function (): Promise<void> {
//       const jwtAdmin = await login(config.users.default.admin.login, 'test', 'SimpleUser');

//       await request(app)
//         .post(config.application.api.basePath + '/user/upload')
//         .set('Authorization', `Bearer ${jwtAdmin}`)
//         .send({
//           email: config.users.default.admin.login
//         })
//         .expect(400)
//         .expect((res) => {
//           const expectedError = {
//             errorCode: 40002,
//             errorDetails: {},
//             errorMessage: "Bad request: Cannot read property 'toString' of undefined",
//             statusCode: 400
//           };
//           expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
//         });
//     });
//   });
// });
