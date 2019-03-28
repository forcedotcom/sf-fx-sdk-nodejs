"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const composite_api_1 = require("./composite-api");
exports.CompositeApi = composite_api_1.CompositeApi;
const ConnectionConfig_1 = require("./ConnectionConfig");
exports.ConnectionConfig = ConnectionConfig_1.ConnectionConfig;
const Constants_1 = require("./Constants");
exports.Constants = Constants_1.Constants;
const SdkInterfaces = require("./Interfaces");
exports.SdkInterfaces = SdkInterfaces;
const rest_1 = require("./rest");
const sdk = require("./sf-sdk");
exports.sdk = sdk;
const SObject_1 = require("./SObject");
exports.SObject = SObject_1.SObject;
const unit_of_work_1 = require("./unit-of-work");
exports.UnitOfWork = unit_of_work_1.UnitOfWork;
async function invoke(fx) {
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());
    await fx.init(config, logger);
    // initialize http request handlers
    // tslint:disable-next-line:no-unused-expression
    new rest_1.default(config, logger, fx);
}
exports.invoke = invoke;
//# sourceMappingURL=index.js.map