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
var InternalError = (function (_super) {
    __extends(InternalError, _super);
    function InternalError(errorDetails) {
        return _super.call(this, resources_1.default.internalError.code, resources_1.default.internalError.message, errorDetails, 500) || this;
    }
    return InternalError;
}(api_error_1.default));
exports.default = InternalError;
;
