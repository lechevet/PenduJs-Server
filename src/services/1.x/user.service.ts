import { config } from '../../config';
import { MongoHelper } from '../../helpers/mongo.helper';
import { MongoError } from '../../models/errors/MongoError';
import { NotFoundError } from '../../models/errors/NotFoundError';
import { WrongCredentialError } from '../../models/errors/WrongCredentialError';
import { JwtValidationError } from '../../models/errors/JwtValidationError';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as promisify from 'es6-promisify';
import * as fs from 'fs';
import { authService } from '../1.x/auth.service';
import { mailService } from '../1.x/mail.service';
import * as mongo from 'mongodb';
import * as uuidv4 from 'uuid/v4';
import * as path from 'path' ;


// tslint:disable-next-line:prefer-const
let mongoHelper = new MongoHelper();


export const usersService = {

  async userRegister(credential:
    {
      firstName: string,
      lastName: string,
      email_address: string,
      password1: string,
      password2: string
    }): Promise<object> {

    /* Check si une adresse mail est rentrée */
    if (credential.email_address === null) {
      const error = new Error('Email address is missing');
      throw new WrongCredentialError(error);
    }
    /* Vérifie si l'adresse mail à le bon format */
    const regex = new RegExp(/(.*)@amiltone.(fr|com)/);
    if (regex.test(credential.email_address) === false) {
      const error = new Error('Email address incorrect format');
      throw new WrongCredentialError(error);
    }

    if (credential.password1.length && credential.password2.length < 4) {
      const error = new Error('Password is too short');
      throw new WrongCredentialError(error);
    }

    let existingUser = false;

    /*  On recherche dans la BBD si l'adresse mail est déja utilisée */
    let user: any = await mongoHelper.findOne(
      config.database.mongoDB.users_collection,
      { email_address: credential.email_address }
    );
    /* On vérifie si il y a un retour d'utilisateur */
    if (user) {
      existingUser = (user.email_address === credential.email_address);
    }
    /*  Si il existe déja, erreur */
    if (existingUser) {
      const error = new Error('User already exist');
      throw new WrongCredentialError(error);
    }
    /* Si il n'existe pas, on insert le nouvel utilisateur */
    if (!existingUser) {
      if (credential.password1 === credential.password2) {

        /* On génère le mot de passe */
        const salt = await this.createSalt();
        const iterations = 12345;
        const algorithm = 'sha512';
        const hashLength = 64;
        const password = credential.password1;
        const pbkdf2 = promisify(crypto.pbkdf2);
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const hashedCredentials = await pbkdf2(hashedPassword, salt, iterations, hashLength, algorithm);

//        let nbrAvatar = credential.email_address.search('@');
//        let shortAvatar = credential.email_address.substr(0, nbrAvatar);
        /* On crée le nouvel user */


        user = await mongoHelper.insertOne(
          config.database.mongoDB.users_collection,
          {
            firstName: credential.firstName,
            lastName: credential.lastName,
            email_address: credential.email_address,
            role: 'SimpleUser',
            status: 'pending',
            password: {
              salt,
              iterations,
              algorithm,
              length: hashLength,
              hash: hashedCredentials.toString('hex')
            },
            avatar: path.join(config.application.img.dir, '/admin.jpg')
          }
        );

        /* On envoie un mail vers l'admin pour notifier une inscription en attente */
        const userRole: any = await mongoHelper.findOne(
          config.database.mongoDB.users_collection,
          { email_address: credential.email_address }
        );
        await mailService.sendPendingRegisterMail(credential.email_address, credential.firstName, credential.lastName, userRole.role);
      } else {
        const error = new Error('Passwords are differents');
        throw new WrongCredentialError(error);
      }
    }

    /* On renvoi les infos sans le mot de passe */
    const newcredential = {
      firstName: credential.firstName,
      lastName: credential.lastName,
      email_address: credential.email_address,
      status: 'pending'
    };

    return newcredential;
  },

  async createSalt(): Promise<void> {
      const newSalt = uuidv4();
      return newSalt;
  },

  async getUsers(params: {
    firstName: string,
    lastName: string,
    role_title: string,
    offset: number,
    limit: number,
    order: number,
    sort: string,
    fields: string[],
  }): Promise<object[]> {
    const query: any = {};
    if (params.firstName) {
      query.firstName = params.firstName;
    }
    if (params.lastName) {
      query.lastName = params.lastName;
    }
    if (params.role_title) {
      query.role = params.role_title;
    }
    query.status = "valid";

    params.limit = 0;

    const mongoCursor = mongoHelper.find(
      config.database.mongoDB.users_collection,
      query,
      params
    );

    const cursor = await mongoCursor;

    let results = await cursor.toArray();
    let Path = path.join(config.application.img.dir, '/admin.jpg') ;
    results = results.map(r => {
      if (r.avatar  && fs.existsSync(r.avatar)) {
        Path = r.avatar;
      }else {
        Path = path.join(config.application.img.dir, '/admin.jpg');
      }
      const bitmap = fs.readFileSync(Path);
      const newavatar = new Buffer(bitmap).toString('base64');
      r.avatar = "data:image/jpeg;base64," + newavatar;
      // fix broken exp
      if (isNaN(r.exp)) {
        r.exp = 1;
      }else {
        if (r.exp < 1 ) {
          r.exp = 1;
        }
      }
      delete r.password;
      return r;
    });
    // results = results.filter(results => results.role !== 'MatchMaker');
    return results;
  },

  async getUser(id: string): Promise<object> {
    const ID = new mongo.ObjectId(id);
    try {
      const user = await mongoHelper.findOne(
        config.database.mongoDB.users_collection,
        {
          _id: ID
        },
        {
          fields: {
            password: 0,
            // created_at: 0,
            updated_at: 0,
            deleted_at: 0
          }
        }
      );
      if (!user) {
        const error = new Error('Non existing user');
        throw new NotFoundError(error);
      }
      /* Encodage img a l'url de avatar */
      let Path = path.join(config.application.img.dir, '/admin.jpg') ;
      if (user.avatar && fs.existsSync(user.avatar)) {
        Path = user.avatar;
      }
      const bitmap = fs.readFileSync(Path);
      const newavatar = new Buffer(bitmap).toString('base64');
      user.avatar = "data:image/jpeg;base64," + newavatar;
      // fix broken exp
      if (isNaN(user.exp)) {
        user.exp = 1;
      }else {
        if (user.exp < 1) {
          user.exp = 1;
        }
      }
      delete user.password;
      return user;
    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  },

  async getAllIdUsers(): Promise<object> {
    try {
      let users: any = {};
      users = await mongoHelper.find(
        config.database.mongoDB.users_collection,
        {
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
      if (!users) {
        const error = new Error('Non existing users in DB');
        throw new NotFoundError(error);
      }


      return users;
    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  },

  async getNbUsers(): Promise<number> {
    try {
      const users: any = {};
      const countusers = await mongoHelper.count(
        config.database.mongoDB.users_collection,
        {}, {} );
      if (!users) {
        const error = new Error('Non existing users in DB');
        throw new NotFoundError(error);
      }
      return countusers;
    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  },

  // async updateUser(credential: { email_address: string, firstName: string, lastName: string, token: string }): Promise<object> {
  //   try {
  //     /* recuperer email en fonction du token */
  //     const decodedJwt: any =  jwt.verify(credential.token, config.application.jwt.secret);
  //     if ( !decodedJwt) {
  //       const error = new Error('Authentication error: Invalid JWT user id');
  //       throw new JwtValidationError(error);
  //     }
  //     const sentMail = decodedJwt.email_address;

  //     if (sentMail != credential.email_address)
  //     {
  //       const error = new Error('Wrong email');
  //       throw new WrongCredentialError(error);
  //     }

  //     const user = await mongoHelper.findOne(
  //       config.database.mongoDB.users_collection,
  //       {
  //         email_address: credential.email_address
  //       }
  //     );
  //     if (!user) {
  //       const error = new Error('Non existing user');
  //       throw new NotFoundError(error);
  //     }

  //     /* Update user */
  //     const newUser = await mongoHelper.updateOne(
  //       config.database.mongoDB.users_collection,
  //       { email_address: credential.email_address },
  //       {
  //         $set: {
  //           firstName: credential.firstName,
  //           lastName: credential.lastName

  //         }
  //       });

  //     if (!newUser) {
  //       const error = new Error('Mongo Error : Update of the user fail');
  //       throw new MongoError(error);
  //     }
  //     delete newUser.password;
  //     return newUser;

  //   } catch (error) {
  //     if (!error.errorCode) {
  //       throw new MongoError(error);
  //     }
  //     throw error;
  //   }
  // },

  async UploadImage(image: object, email: string, token: string): Promise<any> {

      /* recuperer email en fonction du token */
      const decodedJwt: any =  jwt.verify(token, config.application.jwt.secret);
      if ( !decodedJwt) {
        const error = new Error('Authentication error: Invalid JWT user id');
        throw new JwtValidationError(error);
      }
      const sentMail = decodedJwt.email_address;

      if (sentMail !== email) {
        const error = new Error('Wrong email');
        throw new WrongCredentialError(error);
      }
    try {/* decode image, stock image en clair sur dossier serveur*/
      const newimage = image.toString();
      const nbrpath = email.search('@');
      let base64Data = "";
      const Path = path.join(config.application.img.dir, '/', email.substr(0, nbrpath)) ;
      if (newimage.search("data:image/png;") !== -1) {
        base64Data = newimage.replace(/^data:image\/png;base64,/, '');
      } else if (newimage.search("data:image/jpeg;") !== -1) {
        base64Data = newimage.replace(/^data:image\/jpeg;base64,/, '');
      } else if (newimage.search("data:image/jpg;") !== -1) {
        base64Data = newimage.replace(/^data:image\/jpg;base64,/, '');
      } else if (newimage.search("data:image/gif;") !== -1) {
        base64Data = newimage.replace(/^data:image\/gif;base64,/, '');
      } else if (newimage.search("data:image/bmp;") !== -1) {
        base64Data = newimage.replace(/^data:image\/bmp;base64,/, '');
      }
      fs.writeFile(Path, base64Data, 'base64', function (err) {
        console.log(err);
      });
      const newimg = await mongoHelper.updateOne(
        config.database.mongoDB.users_collection,
        { email_address: email },
        {
          $set: {/* set nom image*/
            avatar: Path
          }
        });
      if (newimg) {
        return Path;
      }

    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  },

  async setPushToken(token: string, id: string): Promise<object> {

    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
      const error = new Error('Invalid push token');
      throw new WrongCredentialError(error);
    }

    // check that the user exists in the database

    const existingUserCursor = await mongoHelper.find(
      config.database.mongoDB.users_collection,
      { email_address: { $eq: id } }
    );

    const existingUser = await existingUserCursor.toArray();
    if (existingUser.length !== 1) {
      const error = new Error('Invalid JWT user id');
      throw new WrongCredentialError(error);
    }

    // if any user already have this token, remove it

    await mongoHelper.updateMany(
      config.database.mongoDB.users_collection,
      { push_token: { $eq: token } },
      { $set: { push_token: null } }
    );

    return await mongoHelper.updateOne(
      config.database.mongoDB.users_collection,
      { email_address: id },
      { $set: { push_token: token } }
    );
  },

  async removePushToken(userId: string): Promise<any> {
    const existingUserCursor = await mongoHelper.find(
      config.database.mongoDB.users_collection,
      { email_address: { $eq: userId } }
    );

    const existingUser = await existingUserCursor.toArray();
    if (existingUser.length !== 1) {
      const error = new Error('Invalid JWT user id');
      throw new WrongCredentialError(error);
    }

    // if user doesn't have any token, nothing has to be done
    if (!existingUser[0].hasOwnProperty('push_token')) {
      return;
    }

    // to avoid duplicates and possible errors, delete every occurence of this token in the database
    await mongoHelper.updateMany(
      config.database.mongoDB.users_collection,
      { push_token: { $eq: existingUser[0].push_token } },
      { $set: { push_token: null } }
    );
  },

  async getUserByEmail(userEmail: string): Promise<object> {
    try {
      const user = await mongoHelper.findOne(
        config.database.mongoDB.users_collection,
        { email_address: userEmail },
        {
          fields: {
          }
        }
      );
      if (!user) {
        const error = new Error('Non existing user');
        throw new NotFoundError(error);
      }
      delete user.password;
      return user;
    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  },

  async sendResetLinkPassword(user: any): Promise<any> {
    try {
      if (user) {
        // TODO
        const token: any = await authService.createTokenLinkPassword(user);
        // sendMail
        await mailService.sendNewPasswordMail(user.email_address, user.firstName, user.lastName, token.token);
        return 'ok';
      }
    } catch (error) {
      if (!error.errorCode) {
        throw new MongoError(error);
      }
      throw error;
    }
  }


};
