"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const sdk = require("./sf-sdk");
exports.sdk = sdk;
async function invoke(fx) {
    // Setup
    const config = new sdk.Config();
    const logger = sdk.Logger.create(config.isVerbose());
    try {
        // Init function
        await fx.init(config, logger);
        // Create and validate Cloudevent
        const eventPayload = JSON.parse(process.env.SF_FX_PAYLOAD);
        const cloudEvent = new sdk.SfCloudevent(eventPayload);
        cloudEvent.check();
        // Setup context
        const context = await sdk.Context.create(cloudEvent.getData(), logger);
        // Invoke function
        await fx.invoke(context, cloudEvent);
    }
    catch (err) {
        logger.error(err.message, err);
    }
}
exports.invoke = invoke;
var composite_api_1 = require("./composite-api");
exports.CompositeApi = composite_api_1.CompositeApi;
var ConnectionConfig_1 = require("./ConnectionConfig");
exports.ConnectionConfig = ConnectionConfig_1.ConnectionConfig;
var Constants_1 = require("./Constants");
exports.Constants = Constants_1.Constants;
__export(require("./api"));
__export(require("./Interfaces"));
var SObject_1 = require("./SObject");
exports.SObject = SObject_1.SObject;
var unit_of_work_1 = require("./unit-of-work");
exports.UnitOfWork = unit_of_work_1.UnitOfWork;
//# sourceMappingURL=index.js.map