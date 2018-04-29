import { WrongCredentialError } from '../models/errors/WrongCredentialError';
import { WrongPermissionError } from '../models/errors/WrongPermissionError';

export enum Permissions {
  GET_USERS,
  SET_OWN_TOKEN,
  DELETE_OWN_TOKEN,
  GET_REGISTERS,
  VALIDATE_REGISTER
}

// Get all enum keys, and transform them into an array of integers displaying their index
const allPermissions = Object.keys(Permissions).map(k => Permissions[k]).filter(v => typeof v === 'number') as number[];

const permissionsByRole = {
  Administrator: allPermissions,
  SimpleUser: [
    Permissions.SET_OWN_TOKEN,
    Permissions.DELETE_OWN_TOKEN,
	Permissions.GET_USERS
  ]
};

/**
 * A request can require multiple permissions level to be done. Check if the logged user has all of them
 * @param userInfos
 * @param {Permissions[]} neededPermissions
 */
export function checkPermissionLevel(userInfos: { email_address: string, role: string },
                                     neededPermissions: Permissions[]): void {
  if (!neededPermissions
    || !userInfos
    || !userInfos.email_address
    || !userInfos.role
    || !permissionsByRole.hasOwnProperty(userInfos.role)) {
    const error = new Error('Invalid user permission');
    throw new WrongCredentialError(error);
  }
  const userPermissions = permissionsByRole[userInfos.role];
  neededPermissions.forEach(permName => {
    if (userPermissions.indexOf(permName) === -1) {
      const error = new Error('Insufficient permissions');
      throw new WrongPermissionError(error);
    }
  });
}
