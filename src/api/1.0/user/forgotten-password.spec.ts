import { expect } from 'chai';
import * as request from 'supertest';
import { app } from '../../../app';
import { config } from '../../../config';
import * as path from 'path' ;

describe("/user/forgotten-password", () => {
    describe('POST', () => {
        it('should throw an error if the user doesn\'t exists', async function(): Promise<void> {
            await request(app)
                .post(path.join(config.application.api.basePath, "/user/forgotten-password"))
                .send({
                    email_address: "badaddress@test.api"
                })
                .expect(404)
                .expect((res) => {
                    expect(res.error).to.not.equal(true);
                    expect(res.error.message).to.equal('cannot POST /api/1.0/user/forgotten-password (404)');
                    const expectedError = {
                      errorDetails: {},
                      errorCode: 40401,
                      statusCode: 404,
                      errorMessage: 'Can\'t find the requested information: Non existing user'
                    };
                    expect(JSON.parse(res.error.text)).to.deep.equal(expectedError);
                  });
        });
    });
});
