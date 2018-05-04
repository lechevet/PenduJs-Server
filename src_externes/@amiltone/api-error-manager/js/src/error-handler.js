"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var api_errors_1 = require("./api-errors");
var api_error_1 = require("./api-error");
var mongodb_error_1 = require("./sub-errors/mongodb-error");
var jwt_error_1 = require("./sub-errors/jwt-error");
var internal_error_1 = require("./sub-errors/internal-error");
var _isMongoError = function (error) {
    return (error.name !== undefined && error.name === 'MongoError');
};
var _isJWTError = function (error) {
    return (error.name !== undefined && error.name === 'JsonWebTokenError');
};
var _mongoError = function (error) {
    return new mongodb_error_1.default(error);
};
var _jwtError = function (error) {
    return new jwt_error_1.default(error);
};
function default_1(error, req, res, next) {
    var err = new api_errors_1.default();
    if (error instanceof api_error_1.default) {
        err.add(error);
    }
    else if (error instanceof api_errors_1.default) { }
    else if (_isMongoError(error)) {
        err.add(_mongoError(error));
    }
    else if (_isJWTError(error)) {
        err.add(_jwtError(error));
    }
    else {
        err.add(new internal_error_1.default(error));
    }
    res.status(err.errors[0].statusCode).json(err.errors);
}
exports.default = default_1;
;
