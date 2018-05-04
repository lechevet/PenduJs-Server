export default class APIError extends Error {
    errorCode: Number;
    errorMessage: string;
    errorDetails: Object;
    statusCode: Number;
    constructor(errorCode: Number, errorMessage: string, errorDetails: Object, statusCode: Number);
    getStatusCode(): Number;
}
