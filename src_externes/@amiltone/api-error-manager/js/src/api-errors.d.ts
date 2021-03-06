import APIError from './api-error';
export default class APIErrors {
    errors: Array<APIError>;
    constructor();
    add(error: APIError): void;
    hasError(): Boolean;
}
