// import { Operation } from 'express-openapi';
// import { generateLog, logger } from '../../../helpers/logger.helper';
// import { usersService } from '../../../services/1.x/user.service';

// export const put: Operation = async function(req: any, res: any, next: any): Promise<void> {
//     try {

//       const userResponse: any = await usersService.updateUser(req.body);
//       logger.info(generateLog({
//         responseStatus: 201,
//         responseMessage: `User with id: ${userResponse.email_address} successfully updated.`
//       }));
//       res.status(201).json(userResponse);
//     } catch (error) {
//       next(error);
//     }
// };

// put.apiDoc = {
//   summary: 'Update user',
//   operationId: 'userUpdate',
//   tags: ['Auth', 'PUT'],
//   parameters: [
//     {
//       name: 'credential',
//       in: 'body',
//       schema: {
//         type: 'object',
//         required: ['firstName', 'lastName', 'email_address'],
//         properties: {
//           firstName: {
//             type: 'string'
//           },
//           lastName: {
//             type: 'string'
//           },
//           email_address: {
//             type: 'string'
//           }
//         }
//       },
//       required: true,
//       description: 'User credential'
//     }
//   ],
//   responses: {
//     200: {
//       description: 'User updated',
//       schema: {
//         type: 'object',
//         properties: {
//           user: {
//             type: 'object'
//           }
//         }
//       }
//     },
//     default: {
//       description: 'An error occurred',
//       schema: {
//         $ref: '#/definitions/Error'
//       }
//     }
//   }
// };
