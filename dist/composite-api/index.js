"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CompositeApi_1 = require("./CompositeApi");
const CompositeRequest_1 = require("./CompositeRequest");
const CompositeSubrequest_1 = require("./CompositeSubrequest");
exports.HttpCodes = CompositeApi_1.HttpCodes;
exports.newCompositeApi = CompositeApi_1.newCompositeApi;
exports.newCompositeRequest = CompositeRequest_1.newCompositeRequest;
exports.deleteBuilder = CompositeSubrequest_1.deleteBuilder;
exports.describeBuilder = CompositeSubrequest_1.describeBuilder;
exports.httpGETBuilder = CompositeSubrequest_1.httpGETBuilder;
exports.insertBuilder = CompositeSubrequest_1.insertBuilder;
exports.patchBuilder = CompositeSubrequest_1.patchBuilder;
exports.putBuilder = CompositeSubrequest_1.putBuilder;
//# sourceMappingURL=index.js.map