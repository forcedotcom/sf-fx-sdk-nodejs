"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CompositeApi_1 = require("./CompositeApi");
const CompositeRequest_1 = require("./CompositeRequest");
const CompositeSubrequest_1 = require("./CompositeSubrequest");
// tslint:disable-next-line:variable-name
exports.CompositeApi = {
    HttpCodes: CompositeApi_1.HttpCodes,
    deleteBuilder: CompositeSubrequest_1.deleteBuilder,
    describeBuilder: CompositeSubrequest_1.describeBuilder,
    httpGETBuilder: CompositeSubrequest_1.httpGETBuilder,
    insertBuilder: CompositeSubrequest_1.insertBuilder,
    newCompositeApi: CompositeApi_1.newCompositeApi,
    newCompositeRequest: CompositeRequest_1.newCompositeRequest,
    patchBuilder: CompositeSubrequest_1.patchBuilder,
    putBuilder: CompositeSubrequest_1.putBuilder
};
//# sourceMappingURL=index.js.map