import APIError from '../api-error';
export default class InternalError extends APIError {
    constructor(errorDetails: Object);
}
