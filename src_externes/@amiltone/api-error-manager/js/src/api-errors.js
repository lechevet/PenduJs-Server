"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var APIErrors = (function () {
    function APIErrors() {
        this.errors = [];
    }
    APIErrors.prototype.add = function (error) {
        this.errors.forEach(function (e) {
            if (e.statusCode !== error.statusCode) {
                throw new Error('[APIErrors] : You can only store identical status code errors on a single APIErrors instance');
            }
        });
        this.errors.push(error);
    };
    ;
    APIErrors.prototype.hasError = function () {
        return this.errors.length > 0;
    };
    ;
    return APIErrors;
}());
exports.default = APIErrors;
;
