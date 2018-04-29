import { config } from '../../config';
import * as nodemailer from 'nodemailer';
import { InvalidParametersError } from '../../models/errors/InvalidParametersError';
import { MongoHelper } from '../../helpers/mongo.helper';
import { NotFoundError } from '../../models/errors/NotFoundError';
import { EmailError } from '../../models/errors/EmailError';

// tslint:disable-next-line:prefer-const
let mongoHelper = new MongoHelper();

const smtpTransport = nodemailer.createTransport({
    host: 'mail.gandi.net',
    auth: {
        user: config.users.mail.admin.login,
        pass: config.users.mail.admin.password
    }
});

export const mailService = {

    async sendNewPasswordMail(emailAddress: string, firstname: string, lastname: string, token: string): Promise<void> {
        if (!emailAddress) {
            const error = new Error('User has no email address.');
            throw new InvalidParametersError(error);
        }
        // TODO
        // MISE EN PAGE MESSAGE
        const mail = {
            from: config.users.mail.admin.login,
            to: emailAddress,
            subject: '[PenduJs] Mot de passe oublié',
            html: `${firstname} ${lastname} <br>Suivez ce lien pour créer un nouveau
            mot de passe: <br> <a href="http://${config.application.ip}:4200/new-password?token=${token}"</a>Créer un nouveau mot de passe.`
        };
        await smtpTransport.sendMail(mail, async (err: any): Promise<void> => {
            if (err) {
                throw new EmailError(err);
            }
            await smtpTransport.close();
        });
    },
    async sendPendingRegisterMail(emailAddress: string, firstname: string, lastname: string, role: string): Promise<void> {
        let emails: string = "";
        const query: object = {
            role: 'Administrator'
        };
        const mongoCursor = mongoHelper.find(config.database.mongoDB.users_collection, query);
        const cursor = await mongoCursor;

        const results = await cursor.toArray();
        if (results.length === 0) {
            const error = new Error('There is no Administrator');
            throw new NotFoundError(error);
        }
        for (const e of results) {
            emails += (e.email_address + ", ");
        }
        // TODO
        // MISE EN PAGE MESSAGE
        const mail = {
            from: config.users.mail.admin.login,
            to: emails,
            subject: '[PenduJs] Nouvelle demande d\'inscription',
            html: `Un nouvel utilisateur souhaite s\'inscrire sur
            PenduJs Manager: ${firstname} ${lastname} <br> ${emailAddress} <br><br> Role: ${role}.`
        };
        await smtpTransport.sendMail(mail, async (err: any): Promise<void> => {
            if (err) {
                throw new EmailError(err);
            }
            await smtpTransport.close();
        });
    },
    async sendValidateMail(emailAddress: string): Promise<void> {

        if (!emailAddress || emailAddress === '') {
            const error = new Error('User have no email address.');
            throw new InvalidParametersError(error);
        }

        // TODO
        // Changer texte du mail envoyé
        const mail = {
            from: config.users.mail.admin.login,
            to: emailAddress,
            subject: '[PenduJs] Inscription validée',
            html: 'Votre inscritpion sur PenduJs vient d\'être validée.'
        };
        await smtpTransport.sendMail(mail, async (err: any): Promise<any> => {
            if (err) {
                throw new EmailError(err);
            }
            await smtpTransport.close();
        });
    },

    async sendDeleteRegisterMail(emailAddress: string): Promise<void> {
        if (!emailAddress) {
            const error = new Error('User have no email address.');
            throw new InvalidParametersError(error);
        }
        // TODO
        // Changer texte du mail envoyé
        const mail = {
            from: config.users.mail.admin.login,
            to: emailAddress,
            subject: '[PenduJs] Inscription refusée',
            html: 'Votre inscritpion sur PenduJs a été refusée.'
        };
        await smtpTransport.sendMail(mail, async (err: any): Promise<any> => {
            if (err) {
                throw new EmailError(err);
            }
            await smtpTransport.close();
        });
    }
};
