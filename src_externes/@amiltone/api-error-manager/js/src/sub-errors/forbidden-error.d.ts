import APIError from '../api-error';
export default class ForbiddenError extends APIError {
    constructor(errorDetails: Object);
}
