import { expect } from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as moment from 'moment';

chai.use(sinonChai);

import { MongoHelper } from '../../../helpers/mongo.helper';
const mongoHelper = new MongoHelper();


describe('mongodb helper', function (): void {
  describe('#updateMany', function (): void {
    it('should return an error if the filter is not sent', async function (): Promise<void> {
      try {
        await mongoHelper.updateMany('test', null);
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Can\'t update documents without filter');
      }
    });

    it('should return an error if the filter is an empty object', async function (): Promise<void> {
      try {
        await mongoHelper.updateMany('test', {}, {});
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Can\'t update documents without filter');
      }
    });
  });

  describe('#geoNear', function (): void {
    it('should return an error if the x is not send', async function (): Promise<void> {
      try {
        await mongoHelper.geoNear('test', NaN, 5);
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No value to search geographically');
      }
    });

    it('should return an error if the y is not send', async function (): Promise<void> {
      try {
        await mongoHelper.geoNear('test', 5, NaN);
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No value to search geographically');
      }
    });

    it('should return an error if both geographic value are null', async function (): Promise<void> {
      try {
        await mongoHelper.geoNear('test', NaN, NaN);
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No value to search geographically');
      }
    });
  });

  describe('#geoHaystackSearch', function (): void {
    it('should return an error if the x is not send', async function (): Promise<void> {
      try {
        await mongoHelper.geoHaystackSearch('test', NaN, 5);
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No value to search geographically');
      }
    });

    it('should return an error if the y is not send', async function (): Promise<void> {
      try {
        await mongoHelper.geoHaystackSearch('test', 5, NaN);
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No value to search geographically');
      }
    });

    it('should return an error if both geographic value are null', async function (): Promise<void> {
      try {
        await mongoHelper.geoHaystackSearch('test', NaN, NaN);
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No value to search geographically');
      }
    });
  });

  describe('#distinct', function (): void {
    it('should return an error if the field is not sent', async function (): Promise<void> {
      try {
        await mongoHelper.distinct('test', null);
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No field to return distinct values');
      }
    });

    it('should return an error if the field is an empty string', async function (): Promise<void> {
      try {
        await mongoHelper.distinct('test', '');
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No field to return distinct values');
      }
    });
  });

  describe('#upsertMany', function (): void {

    const oneDate = moment().valueOf();
    const upsertManySpecificMongoHelper = new MongoHelper();

    beforeEach(async function (): Promise<void> {
      // we place a fake 'bulkWrite' funtion to prevent unwanted saving of data
      upsertManySpecificMongoHelper.bulkWrite = async function (_collection: string,
                                                                _operations: object[],
                                                                _options: object = {}): Promise<object> {
        return {
          message: 'ok'
        };
      };
    });

    it('should return an error if the upsertfields is an empty', async function (): Promise<void> {
      try {
        await upsertManySpecificMongoHelper.upsertMany(
          'test',
          [],
          [],
          {},
          {}
        );
      } catch (error) {
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: No upsertFields to search particular data');
      }
    });

    it('should return an error if one upsert field is empty', async function (): Promise<void> {
      const spyFail = sinon.spy();
      upsertManySpecificMongoHelper.bulkWrite = async function (_collection: string,
                                                                _operations: object[],
                                                                _options: object = {}): Promise<object> {
        spyFail();
        return {
          message: 'ok'
        };
      };

      try {
        await upsertManySpecificMongoHelper.upsertMany(
          'test',
          ['login', '', 'role'],
          [
            {login: 'foo 1', role: 'bar 101'}
          ],
          {},
          {}
        );
      } catch (error) {
        expect(spyFail.callCount).to.equal(0);
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Upsert field missing on data object');
      }
    });


    it('should return an error if one upsert field is not present in one data', async function (): Promise<void> {
      const spyFail = sinon.spy();
      upsertManySpecificMongoHelper.bulkWrite = async function (_collection: string,
                                                                _operations: object[],
                                                                _options: object = {}): Promise<object> {
        spyFail();
        return {
          message: 'ok'
        };
      };

      try {
        await upsertManySpecificMongoHelper.upsertMany(
          'test',
          ['login', 'role'],
          [
            {login: 'foo 1', role: 'bar 101'},
            {login: 'foo 2', role: 'bar 202'},
            {login: 'foo 3', role: 'bar 303'},
            {login: 'foo 4', role: 'bar 404'},
            {login: 'foo 5', role: 'bar 505'},
            {login: 'foo 6', role: 'bar 606'},
            {login: 'foo 7', role: 'bar 707'},
            {login: 'foo 8', notRole: 'bar 808'}
          ],
          {},
          {}
        );
      } catch (error) {
        expect(spyFail.callCount).to.equal(0);
        expect(spyFail.callCount).to.equal(0);
        expect(error.errorCode).to.equal(40002);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(400);
        expect(error.errorMessage).to.equal('Bad request: Upsert field missing on data object');
      }
    });

    it('should reject if "bulkWrite" fails', async function (): Promise<void> {
      const spySuccess = sinon.spy();
      upsertManySpecificMongoHelper.bulkWrite = async function (_collection: string,
                                                                _operations: object[],
                                                                _options: object = {}): Promise<object> {
        spySuccess();
        throw new Error('error');
      };

      try {
        await upsertManySpecificMongoHelper.upsertMany(
          'test',
          ['login', 'role'],
          [
            {login: 'foo 1', role: 'bar 101'}
          ],
          {},
          {}
        );
      } catch (error) {
        expect(spySuccess.callCount).to.equal(1);
        expect(error.message).to.deep.equal('Bad request: error');
      }
    });

    it('should build the request for the bulkWrite function', async function (): Promise<void> {
      const spySuccess = sinon.spy();
      upsertManySpecificMongoHelper.bulkWrite = async function (collection: string,
                                                                operations: object[],
                                                                options: object = {}): Promise<object> {
        spySuccess(collection, operations, options);
        return {
          message: 'ok'
        };
      };
      // Date just before the upserts

      const result = await upsertManySpecificMongoHelper.upsertMany(
        'test',
        ['login', 'role'],
        [
          {login: 'foo 1', role: 'bar 101', name: 'Mark', more: {hello: 'world'}},
          {login: 'foo 2', role: 'bar 202', name: 'Marie'}
        ],
        {},
        {
          bulkWriteOption: 'some option'
        }
      );

      expect(result).to.deep.equal({
        message: 'ok'
      });

      expect(spySuccess.callCount).to.equal(1);
      expect(spySuccess.firstCall.args[0]).to.equal('test');
      expect(spySuccess.firstCall.args[2]).to.deep.equal({
        bulkWriteOption: 'some option'
      });

      // Check first element's updated_at attribute
      expect(spySuccess.firstCall.args[1][0].updateOne.update.$set.updated_at).to.be.not.equal(null);
      expect(moment(spySuccess.firstCall.args[1][0].updateOne.update.$set.updated_at).valueOf())
        .to.be.not.greaterThan(moment().valueOf());
      expect(moment(spySuccess.firstCall.args[1][0].updateOne.update.$set.updated_at).valueOf())
        .to.be.greaterThan(oneDate);
      delete spySuccess.firstCall.args[1][0].updateOne.update.$set.updated_at;

      // Check second element's updated_at attribute
      expect(spySuccess.firstCall.args[1][1].updateOne.update.$set.updated_at).to.be.not.equal(null);
      expect(moment(spySuccess.firstCall.args[1][1].updateOne.update.$set.updated_at).valueOf())
        .to.be.greaterThan(oneDate);
      expect(moment(spySuccess.firstCall.args[1][1].updateOne.update.$set.updated_at).valueOf())
        .to.be.not.greaterThan(moment().valueOf());
      delete spySuccess.firstCall.args[1][1].updateOne.update.$set.updated_at;

      // Check first element's setOnInsert created_at attribute
      expect(spySuccess.firstCall.args[1][0].updateOne.update.$setOnInsert.created_at).to.be.not.equal(null);
      expect(moment(spySuccess.firstCall.args[1][0].updateOne.update.$setOnInsert.created_at).valueOf())
        .to.be.greaterThan(oneDate);
      expect(moment(spySuccess.firstCall.args[1][0].updateOne.update.$setOnInsert.created_at).valueOf())
        .to.be.not.greaterThan(moment().valueOf());
      delete spySuccess.firstCall.args[1][0].updateOne.update.$setOnInsert.created_at;
      expect(spySuccess.firstCall.args[1]).to.deep.equal([
        {
          updateOne: {
            filter: {
              login: 'foo 1',
              role: 'bar 101'
            },
            update: {
              $set: {
                login: 'foo 1',
                role: 'bar 101',
                name: 'Mark',
                more: {
                  hello: 'world'
                }
              },
              $setOnInsert: {}
            },
            upsert: true
          }
        },
        {
          updateOne: {
            filter: {
              login: 'foo 2',
              role: 'bar 202'
            },
            update: {
              $set: {login: 'foo 2', role: 'bar 202', name: 'Marie'},
              $setOnInsert: {}
            },
            upsert: true
          }
        }
      ]);
    });

  });
});
