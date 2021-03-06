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
        return _super.call(this, resources_1.default.internalError.code, resources_1.default.internalError.message, {
            errorSubCode: error.code,
            errorSubMessage: error.message
        }, 500) || this;
    }
    return MongoDBError;
}(api_error_1.default));
exports.default = MongoDBError;
;
