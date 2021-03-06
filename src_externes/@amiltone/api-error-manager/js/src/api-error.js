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
var APIError = (function (_super) {
    __extends(APIError, _super);
    function APIError(errorCode, errorMessage, errorDetails, statusCode) {
        var _this = _super.call(this, errorMessage) || this;
        _this.errorCode = errorCode;
        _this.errorMessage = errorMessage;
        _this.errorDetails = errorDetails;
        _this.statusCode = statusCode;
        return _this;
    }
    APIError.prototype.getStatusCode = function () {
        return this.statusCode;
    };
    return APIError;
}(Error));
exports.default = APIError;
;
