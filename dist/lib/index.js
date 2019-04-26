"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk = require("./sf-sdk");
exports.sdk = sdk;
async function invoke(fx) {
    // Setup
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());
    try {
        // Create and validate Cloudevent
        const sfFxPayload = JSON.parse(process.env.SF_FX_PAYLOAD);
        const cloudEvent = new sdk.Cloudevent(sdk.Cloudevent.specs['0.2']);
        cloudEvent.spec.payload = Object.assign(cloudEvent.spec.payload, sfFxPayload);
        cloudEvent.spec.check();
        // Setup context
        const context = await sdk.Context.create(cloudEvent.getData(), logger);
        // Init function
        await fx.init(config, logger);
        // Invoke function
        await fx.invoke(context, cloudEvent);
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