"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk = require("./sf-sdk");
exports.sdk = sdk;
const events_1 = require("./events");
const rest_1 = require("./rest");
async function invoke(fx) {
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());
    await fx.init(config, logger);
    // initialize http request handlers
    new rest_1.default(config, logger, fx);
    // initialize message consumer and producer clients
    if (config.hasMessagingConfig()) {
        new events_1.default(config, logger, fx);
    }
    else {
        logger.shout('Skipping event setup: configuration not provided or is incomplete.');
    }
}
exports.invoke = invoke;
//# sourceMappingURL=index.js.map