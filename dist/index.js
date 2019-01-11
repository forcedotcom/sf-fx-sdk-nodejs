"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk = require("./sf-sdk");
exports.sdk = sdk;
const events_1 = require("./events");
const rest_1 = require("./rest");
const valueSeparator = /[,\s]+/;
async function run(fx) {
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());
    await fx.init(config, logger);
    new rest_1.default(config, logger, fx);
    new events_1.default(config, logger, fx);
}
exports.run = run;
//# sourceMappingURL=index.js.map