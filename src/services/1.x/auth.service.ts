/**
 * <services/authService.helper>
 * This module is to manage the authentication of users.
 */

import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as jwt from 'jsonwebtoken';
import * as mongo from 'mongodb';
import * as moment from 'moment';
import { config } from '../../config';
import { MongoHelper } from '../../helpers/mongo.helper';
import { JwtValidationError } from '../../models/errors/JwtValidationError';
import { TokenCreationError } from '../../models/errors/TokenCreationError';
import { WrongCredentialError } from '../../models/errors/WrongCredentialError';
import { NotFoundError } from '../../models/errors/NotFoundError';
import { MongoError } from '../../models/errors/MongoError';

const mongoHelper = new MongoHelper();


export const authService = {

  async userLogin(credential: { login: string, password: string }): Promise<object> {

    // first parsing, are the mail and password made of valid characters
    if (credential.login === null) {
      const error = new Error('Login is missing');
      throw new WrongCredentialError(error);
    }


    const regex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    if (regex.test(credential.login) === false) {
      const error = new Error('Wrong credentials');
      throw new WrongCredentialError(error);
    }

    const user: any = await mongoHelper.findOne(
      config.database.mongoDB.users_collection,
      { email_address: credential.login },
      {
        fields: {
          created_at: 0,
          updated_at: 0,
          deleted_at: 0
        }
      }
    );

    // checking user credential and creating token if needed
    // if the value is null, then we didn't find a match in the database
    if (!user || !user.password || typeof user.password !== 'object') {
      const error = new Error('Non existant credential');
      throw new WrongCredentialError(error);
    }

    if (user.status !== 'valid') {
      const error = new Error('account must be validated.');
      throw new WrongCredentialError(error);
    }

    // Checking DB password object validity
    if (!user.password.hasOwnProperty('hash')
      || !user.password.hasOwnProperty('salt')
      || !user.password.hasOwnProperty('iterations')
      || !user.password.hasOwnProperty('length')
      || !user.password.hasOwnProperty('algorithm')) {
      const error = new Error('Invalid password format');
      throw new WrongCredentialError(error);
    }

    // In order to check the user password's validity :
    const passwordObject = user.password;
    delete user.password;
    console.log(passwordObject);
    // We use its salt & iteration count in order to hash the credential password the same way its password was
    const hashedCredentials = await authService.hashPassword(credential.password,
      {
        salt: passwordObject.salt.toString(),
        iterations: passwordObject.iterations,
        length: passwordObject.length,
        algorithm: passwordObject.algorithm
      });
    // console.log(hashedCredentials);          // pour ajouter un nouvel utilisateur pour le moment

    // If the hashed credential is equal to the DB-stored one, the user entered correct infos
    const correctCredentials = (hashedCredentials.hash === passwordObject.hash);

    if (!correctCredentials) {
      const error = new Error('Wrong credentials');
      throw new WrongCredentialError(error);
    }
    const token = await authService.createToken(user);

    await mongoHelper.updateOne(
      config.database.mongoDB.users_collection,
      { email_address: user.email_address },
      { $set: { last_login: moment().toISOString() } }
    );

    return token;
  },

  async loginRapide(email: string): Promise<object> {
    if (email === null) {
      const error = new Error('email is missing');
      throw new WrongCredentialError(error);
    }
    const regex = new RegExp(/(.*)@amiltone.(fr|com)/);
    if (regex.test(email) === false) {
      const error = new Error('Wrong credentials');
      throw new WrongCredentialError(error);
    }
    const user: any = await mongoHelper.findOne(
      config.database.mongoDB.users_collection,
      { email_address: email },
      {
        fields: {
          created_at: 0,
          updated_at: 0,
          deleted_at: 0,
          password: 0
        }
      }
    );
    // checking user credential and creating token if needed
    if (!user) {
      const error = new Error('Non existant credential');
      throw new WrongCredentialError(error);
    }
    if (user.status !== 'valid') {
      const error = new Error('account must be validated.');
      throw new WrongCredentialError(error);
    }

    const token = await authService.createToken(user);
    return token;
  },


  /* Changement du mot de passe avec un utilisateur connecté
  TODO : Recupérer le token de l'utilisateur
  */
  async changePassword(credential: { token: string, password1: string, password2: string }): Promise<object> {
    if (!credential.password1 || !credential.password2 || !credential.token) {
      const error = new Error('Missing information for change password');
      throw new WrongCredentialError(error);
    } else {

      const decodedJwt: any = jwt.verify(credential.token, config.application.jwt.secret);
      if (!decodedJwt) {
        const error = new Error('Authentication error: Invalid JWT user id');
        throw new JwtValidationError(error);
      }
      const login = decodedJwt.email_address;

      /* Verifier que le mail existe dans bdd */
      const user: any = await mongoHelper.findOne(
        config.database.mongoDB.users_collection,
        { email_address: login }
      );

      /* Verifier que le mot de passe est au bon format */
      if (credential.password1.length && credential.password2.length < 4) {
        const error = new Error('Password is too short');
        throw new WrongCredentialError(error);
      }

      // checking user credential and creating token if needed
      // if the value is null, then we didn't find a match in the database
      if (!user) {
        const error = new Error('Non existant credential');
        throw new WrongCredentialError(error);
      }

      /* update du password */
      /* On génère le nouveau mot de passe */
      if (credential.password1 === credential.password2) {
        const salt = 'salt';
        const iterations = 12345;
        const algorithm = 'sha512';
        const hashLength = 64;
        const password = credential.password1;
        const pbkdf2 = promisify(crypto.pbkdf2);
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const hashedCredentials = await pbkdf2(hashedPassword, salt, iterations, hashLength, algorithm);

        /* On update l'user */
        await mongoHelper.updateOne(
          config.database.mongoDB.users_collection,
          { email_address: user.email_address },
          {
            $set: {
              password: {
                salt,
                iterations,
                algorithm,
                length: hashLength,
                hash: hashedCredentials.toString('hex')
              }
            }
          });

        /* On recupere toutes les infos updated de l'user */
        const returnuser = await mongoHelper.findOne(
          config.database.mongoDB.users_collection,
          {
            email_address: login
          }
        );
        return returnuser;

      } else {
        const error = new Error('Passwords are differents');
        throw new WrongCredentialError(error);
      }

    }
  },

  /* Changer un password oublié : verification du token contenu dans le lien envoyé par mail a l'utilisateur */
  async changeForgetPassword(credential: { token: string }): Promise<object> {
    if (!credential.token) {
      const error = new Error('Missing information for change password');
      throw new WrongCredentialError(error);
    } else {


      /* recuperer email en fonction du token */
      const decodedJwt = jwt.verify(credential.token, config.application.jwt.secret);

      if (!decodedJwt) {
        const error = new Error('Authentication error: Invalid JWT user id');
        throw new JwtValidationError(error);
      }

      const login = decodedJwt.email_address;

      /* Verifier que le mail existe dans bdd */
      const user: any = await mongoHelper.findOne(
        config.database.mongoDB.users_collection,
        { email_address: login }
      );
      // checking user credential and creating token if needed
      // if the value is null, then we didn't find a match in the database
      if (!user) {
        const error = new Error('Non existant credential');
        throw new WrongCredentialError(error);
      }

      /* email ok, creer new token de connexion */
      const token = jwt.sign(
        {
          email_address: login,
          role: user.role
        },
        config.application.jwt.secret,
        {
          expiresIn: config.application.jwt.expiration_time
        }
      );
      /* Renvoi du token de connexion */

      return { token };

    }
  },

  async createToken(user: { email_address: string, role: string }): Promise<object> {
    if (!user.email_address || !user.role) {
      const error = new Error('Missing information for the token creation');
      throw new TokenCreationError(error);
    } else {
      const token = jwt.sign(
        {
          email_address: user.email_address,
          role: user.role
        },
        config.application.jwt.secret,
        {
          expiresIn: config.application.jwt.expiration_time
        }
      );

      return {
        user,
        token
      };
    }
  },

  async createTokenLinkPassword(user: { email_address: string, role: string }): Promise<object> {
    if (!user.email_address || !user.role) {
      const error = new Error('Missing information for the token creation');
      throw new TokenCreationError(error);
    } else {
      const token = jwt.sign(
        {
          email_address: user.email_address,
          role: user.role
        },
        config.application.jwt.secret,
        {
          expiresIn: config.application.jwt.expiration_time
        }
      );
      return {
        token
      };
    }
  },

  async hashPassword(password: string,
    params: {
      salt?: any,
      iterations?: number,
      algorithm?: string,
      length?: number
    }): Promise<any> {
    try {
      const hsalt = (params.salt ? params.salt : await crypto.randomBytes(32).toString('hex'));
      const hiterations = (params.iterations ? params.iterations : 12345);
      const halgorithm = (params.algorithm ? params.algorithm : 'sha512');
      const hlength = (params.length ? params.length : 64);
      const pbkdf2 = await promisify(crypto.pbkdf2);
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const hashedCredentials = await pbkdf2(hashedPassword, hsalt, hiterations, hlength, halgorithm);
      return {
        hash: hashedCredentials.toString('hex'),
        salt: hsalt,
        iterations: hiterations,
        length: hlength,
        algorithm: halgorithm
      };
    } catch (error) {
      throw new WrongCredentialError(error);
    }
  },

  async decodeToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, config.application.jwt.secret);
    } catch (error) {
      error.message('Invalid token');
      throw new JwtValidationError(error);
    }
  },

  async getRegisters(): Promise<object[]> {
    const query: object = {
      status: 'pending'
    };
    /* Cherche s'il y a des nouvelles inscriptions */
    const mongoCursor = mongoHelper.find(
      config.database.mongoDB.users_collection,
      query
    );
    const cursor = await mongoCursor;

    /* Renvoie une erreur s'il n'y en a pas */
    let results = await cursor.toArray();
    if (results.length === 0) {
      const error = new Error('There is no pending register');
      throw new NotFoundError(error);
    }

    /* On affiche seulement les infos utiles */
    results = results.map(r => {
      r.created_at = moment(r.created_at).format('YYYY-MM-DD HH:mm:ss');
      delete r.password;
      delete r.role;
      delete r.updated_at;
      delete r.last_login;
      return r;
    });
    return results;
  },

  async getRegister(id: string): Promise<object> {
    /* Retourne un seul utilisateur en fonction d'un id */
    const ID = new mongo.ObjectId(id);
    try {
      const user = await mongoHelper.findOne(
        config.database.mongoDB.users_collection,
        {
          _id: ID,
          status: "pending"
        },
        {
          fields: {
            password: 0,
            created_at: 0,
            updated_at: 0,
            deleted_at: 0
          }
        }
      );
      /* Si user est vide, on renvoie une erreur */
      if (!user) {
        const error = new Error('Non existing register');
        throw new NotFoundError(error);
      }
      return user;
    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  },

  async validateRegister(id: string): Promise<object> {
    /* Valide une nouvelle inscription */
    const ID = new mongo.ObjectId(id);
    try {
      const user = await mongoHelper.updateOne(
        config.database.mongoDB.users_collection,
        {
          _id: ID,
          status: "pending"
        },
        {
          $set: {
            status: "valid"
          }
        }
      );
      /* Vérifie si l'action d'update a été executée ou pas
      retourne une erreur si rien ne s'est passé */
      const userJson = JSON.parse(user);
      if (userJson.n === 0) {
        const error = new Error('Non existing register');
        throw new NotFoundError(error);
      }
      return userJson;
    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  },

  async deleteRegister(id: string): Promise<void> {
    /* Supprime une nouvelle inscription */
    const ID = new mongo.ObjectId(id);
    try {
      let user = await mongoHelper.deleteOne(
        config.database.mongoDB.users_collection,
        {
          _id: ID,
          status: "pending"
        },
        {},
        false
      );
      /* Vérifie si l'action d'update a été executée ou pas
      retourne une erreur si rien ne s'est passé */
      user = JSON.parse(user);
      if (user.n === 0) {
        const error = new Error('Non existing register');
        throw new NotFoundError(error);
      }
      return user;
    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  },

  async verifyToken(userJwt: string): Promise<boolean> {
    try {
      jwt.verify(userJwt, config.application.jwt.secret);
      // const islogged = new BehaviorSubject<boolean>(true);
      return true;
    } catch (error) {
      // const islogged = new BehaviorSubject<boolean>(false);
      return false;
    }
  }
};
