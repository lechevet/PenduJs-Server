import APIError from '../api-error';
export default class MissingFieldError extends APIError {
    constructor(field: string);
}
