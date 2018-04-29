import { expect } from 'chai';
import * as rewire from 'rewire';

const apiDocHelper = rewire('../../../helpers/api-doc.helper');

describe('apiDoc helper', function (): void {
  describe('#getFromRef', function (): void {
    it('should throw an error if the path is invalid', async function (): Promise<void> {
      try {
        apiDocHelper.getDocFromRef('Not a valid path!');
        expect(true).to.equal(false, 'An error should have been thrown as the path is invalid');
      } catch (err) {
        expect(err.errorCode).to.equal(40005);
        expect(err.errorDetails).to.deep.equal({
          invalidParameters: undefined
        });
        expect(err.statusCode).to.equal(400);
        expect(err.errorMessage).to.equal('Bad request: The referenced APIDoc path is invalid');
      }
    });

    it('should throw an error if the path is null', async function (): Promise<void> {
      try {
        apiDocHelper.getDocFromRef(null);
        expect(true).to.equal(false, 'An error should have been thrown as the path is null');
      } catch (err) {
        expect(err.errorCode).to.equal(40005);
        expect(err.errorDetails).to.deep.equal({
          invalidParameters: undefined
        });
        expect(err.statusCode).to.equal(400);
        expect(err.errorMessage).to.equal('Bad request: The referenced APIDoc is not defined');
      }
    });

    it('should throw an error if the path is a number', async function (): Promise<void> {
      try {
        apiDocHelper.getDocFromRef(17);
        expect(true).to.equal(false, 'An error should have been thrown as the path is null');
      } catch (err) {
        expect(err.errorCode).to.equal(40005);
        expect(err.errorDetails).to.deep.equal({
          invalidParameters: undefined
        });
        expect(err.statusCode).to.equal(400);
        expect(err.errorMessage).to.equal('Bad request: The referenced APIDoc path is invalid');
      }
    });

    it('should throw an error if the definitions don\'t exist', async function (): Promise<void> {
      const revertApiDocHelper = apiDocHelper.__set__('apiDoc', {
        apiDoc: {
          no: 'definition'
        }
      });
      try {
        apiDocHelper.getDocFromRef('#/definitions/test');
        expect(true).to.equal(false, 'An error should have been thrown as the APIDoc definitions aren\'t set');
      } catch (err) {
        expect(err.errorCode).to.equal(40005);
        expect(err.errorDetails).to.deep.equal({
          invalidParameters: undefined
        });
        expect(err.statusCode).to.equal(400);
        expect(err.errorMessage).to.equal('Bad request: No definition is set in the APIDoc');
      }
      revertApiDocHelper();

    });

    it('should throw an error if the referenced definition doesn\'t exist', async function (): Promise<void> {
      const revertApiDocHelper = apiDocHelper.__set__('apiDoc', {

        apiDoc: {
          definitions: {
            Operation: {
              type: 'number'
            }
          }
        }
      });
      try {
        apiDocHelper.getDocFromRef('#/definitions/test');
        expect(true).to.equal(false, 'An error should have been thrown as the referenced definition doesn\'t exist');
      } catch (err) {
        expect(err.errorCode).to.equal(40005);
        expect(err.errorDetails).to.deep.equal({
          invalidParameters: undefined
        });
        expect(err.statusCode).to.equal(400);
        expect(err.errorMessage).to.equal('Bad request: The referenced APIDoc doesn\'t exist');
      }
      revertApiDocHelper();
    });

    it('should search for the subDocs once the definition is fetched', async function (): Promise<void> {
      const revertApiDocHelper = apiDocHelper.__set__('apiDoc', {
        apiDoc: {
          definitions: {
            Operation: {
              Prop1: {
                type: 'number'
              },
              Prop2: {
                type: 'string'
              },
              Prop3: {
                type: 'array'
              }
            }
          }
        }
      });
      const result = apiDocHelper.getDocFromRef('#/definitions/Operation');
      expect(result).to.deep.equal({
        Prop1: {
          type: 'number'
        },
        Prop2: {
          type: 'string'
        },
        Prop3: {
          type: 'array'
        }
      });
      revertApiDocHelper();
    });
  });
});
