"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var api_error_1 = require("../api-error");
var resources_1 = require("../resources");
var MongoDBError = (function (_super) {
    __extends(MongoDBError, _super);
    function MongoDBError(error) {
        var _this = this;
        var errorDetails;
        switch (error.message) {
            case 'jwt malformed':
                errorDetails = {
                    errorSubCode: resources_1.default.jwt.sub_errors.malformed.code,
                    errorSubMessage: resources_1.default.jwt.sub_errors.malformed.message
                };
                break;
            case 'jwt signature is required':
                errorDetails = {
                    errorSubCode: resources_1.default.jwt.sub_errors.missingSignature.code,
                    errorSubMessage: resources_1.default.jwt.sub_errors.missingSignature.message
                };
                break;
            case 'invalid signature':
                errorDetails = {
                    errorSubCode: resources_1.default.jwt.sub_errors.invalidSignature.code,
                    errorSubMessage: resources_1.default.jwt.sub_errors.invalidSignature.message
                };
                break;
            case 'jwt must be provided':
                errorDetails = {
                    errorSubCode: resources_1.default.jwt.sub_errors.missingToken.code,
                    errorSubMessage: resources_1.default.jwt.sub_errors.missingToken.message
                };
                break;
            default:
                errorDetails = {
                    errorSubCode: resources_1.default.jwt.sub_errors.unknown.code,
                    errorSubMessage: resources_1.default.jwt.sub_errors.unknown.message
                };
                break;
        }
        _this = _super.call(this, resources_1.default.jwt.code, resources_1.default.jwt.message, errorDetails, 500) || this;
        return _this;
    }
    return MongoDBError;
}(api_error_1.default));
exports.default = MongoDBError;
;
