"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SdkInterfaces = require("./Interfaces");
exports.SdkInterfaces = SdkInterfaces;
const sdk = require("./sf-sdk");
exports.sdk = sdk;
async function invoke(fx) {
    console.log('Invoke called');
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());
    try {
        const sfFxPayload = JSON.parse(process.env.SF_FX_PAYLOAD);
        await fx.init(config, logger);
        const context = await sdk.Context.create(sfFxPayload, logger);
        const name = 'cmd';
        await fx.invoke(new sdk.Event(name, context, sfFxPayload.payload));
    }
    catch (err) {
        logger.error(`Error: ${err}`);
    }
}
exports.invoke = invoke;
var composite_api_1 = require("./composite-api");
exports.CompositeApi = composite_api_1.CompositeApi;
var ConnectionConfig_1 = require("./ConnectionConfig");
exports.ConnectionConfig = ConnectionConfig_1.ConnectionConfig;
var Constants_1 = require("./Constants");
exports.Constants = Constants_1.Constants;
var api_1 = require("./api");
exports.forceApi = api_1.forceApi;
var SObject_1 = require("./SObject");
exports.SObject = SObject_1.SObject;
var unit_of_work_1 = require("./unit-of-work");
exports.UnitOfWork = unit_of_work_1.UnitOfWork;
//# sourceMappingURL=index.js.map