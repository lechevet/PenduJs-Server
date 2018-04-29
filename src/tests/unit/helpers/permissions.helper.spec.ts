import { expect } from 'chai';
import * as rewire from 'rewire';
import { Permissions } from '../../../helpers/permissions.helper';

const permissionsHelper = rewire( '../../../helpers/permissions.helper');

describe('permissions helper', function(): void {
  describe('#checkPermissionLevel', function(): void {
    it('should throw an error if the user infos are invalid', function(done: any): void {
      try {
        permissionsHelper.checkPermissionLevel(
          {
            that: 'is not a valid user object'
          },
          [
            Permissions.GET_USERS
          ]
        );
        expect(false).to.equal(true);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40103);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(401);
        expect(error.errorMessage).to.equal('Authentication error: Invalid user permission');
        done();
      }
    });

    it('should throw an error if the user role doesn\'t exist', function(done: any): void {
      try {
        permissionsHelper.checkPermissionLevel(
          {
            _id: 'May be valid',
            role: 'doesn\'t exist'
          },
          [
            Permissions.GET_USERS
          ]
        );
        expect(false).to.equal(true);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40103);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(401);
        expect(error.errorMessage).to.equal('Authentication error: Invalid user permission');
        done();
      }
    });

    it('should throw an error if the permission doesn\'t exist, as the user doesn\'t have access to it',
      function(done: any): void {
      try {
        permissionsHelper.checkPermissionLevel(
          {
            email_address: 'May be valid',
            role: 'Administrator'
          },
          [
            'Doesn\'t exist!'
          ]
        );
        expect(false).to.equal(true);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40302);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(403);
        expect(error.errorMessage).to
          .equal('You are not authorized to access this information: Insufficient permissions');
        done();
      }
    });

    it('should throw an error if the user doesn\'t have access to a permission', function(done: any): void {
      try {
        permissionsHelper.checkPermissionLevel(
          {
            email_address: 'Valid id',
            role: 'SimpleUser'
          },
          [
            Permissions.VALIDATE_REGISTER
          ]
        );
        expect(false).to.equal(true);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40302);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(403);
        expect(error.errorMessage).to
          .equal('You are not authorized to access this information: Insufficient permissions');
        done();
      }
    });

    it('should succeed if the user has access to a permission', function(done: any): void {
      try {
        permissionsHelper.checkPermissionLevel(
          {
            email_address: 'Valid id',
            role: 'Administrator'
          },
          [
            Permissions.GET_USERS
          ]
        );
        done();
      } catch (error) {
        expect(false).to.equal(true);
      }
    });

    it('should succeed if the user has access to multiple permissions', function(done: any): void {
      try {
        permissionsHelper.checkPermissionLevel(
          {
            email_address: 'Valid id',
            role: 'Administrator'
          },
          [
            Permissions.DELETE_OWN_TOKEN,
            Permissions.GET_USERS,
            Permissions.SET_OWN_TOKEN
          ]
        );
        done();
      } catch (error) {
        expect(false).to.equal(true);
      }
    });

    it('should throw an error if the user doesn\'t have access to one permission', function(done: any): void {
      try {
        permissionsHelper.checkPermissionLevel(
          {
            email_address: 'Valid id',
            role: 'SimpleUser'
          },
          [
            Permissions.VALIDATE_REGISTER
          ]
        );
        expect(true).to.equal(false);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40302);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(403);
        expect(error.errorMessage).to
          .equal('You are not authorized to access this information: Insufficient permissions');
        done();
      }
    });

    it('should throw an error if no permissions are sent', function(done: any): void {
      try {
        permissionsHelper.checkPermissionLevel(
          {
            _id: 'Valid id',
            role: 'SimpleUser'
          }
        );
        expect(true).to.equal(false);
      } catch (error) {
        expect(error).to.not.equal(null);
        expect(error.errorCode).to.equal(40103);
        expect(error.errorDetails).to.deep.equal({});
        expect(error.statusCode).to.equal(401);
        expect(error.errorMessage).to.equal('Authentication error: Invalid user permission');
        done();
      }
    });

  });

});
