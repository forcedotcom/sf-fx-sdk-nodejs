import * as sdk from './sf-sdk';
const compositeApi = require('./composite-api');
const config = require('./Config')
const sObject = require('./SObject');
const unitOfWork = require('./unit-of-work');
import EventManager from './events';
import RestManager from './rest';

async function invoke(fx: sdk.SfFunction) {
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());

    await fx.init(config, logger);

    // initialize http request handlers
    new RestManager(config, logger, fx);

    // initialize message consumer and producer clients
    if (config.hasMessagingConfig()) {
        new EventManager(config, logger, fx);
    } else {
        logger.shout('Skipping event setup: configuration not provided or is incomplete.');
    }
}

export { invoke, compositeApi, config, sdk, unitOfWork, sObject };
