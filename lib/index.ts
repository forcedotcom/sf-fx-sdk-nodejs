import * as sdk from './sf-sdk'
import EventManager from './events';
import RestManager from './rest';

const valueSeparator = /[,\s]+/;

async function run(fx: sdk.SfFunction) {

    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());

    await fx.init(config, logger);
    new RestManager(config, logger, fx);
    new EventManager(config, logger, fx);
}

export {
    run,
    sdk
};
