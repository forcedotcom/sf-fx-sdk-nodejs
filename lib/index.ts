import EventManager from './events';
import RestManager from './rest';
import * as SdkInterfaces from './Interfaces';
import * as sdk from './sf-sdk';

export async function invoke(fx: sdk.SfFunction) {
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());

    await fx.init(config, logger);

    // initialize http request handlers
    // tslint:disable-next-line:no-unused-expression
    new RestManager(config, logger, fx);

    // initialize message consumer and producer clients
    if (config.hasMessagingConfig()) {
        // tslint:disable-next-line:no-unused-expression
        new EventManager(config, logger, fx);
    } else {
        logger.shout('Skipping event setup: configuration not provided or is incomplete.');
    }
}

export { CompositeApi } from './composite-api';
export { ConnectionConfig  } from './ConnectionConfig';
export { Constants } from './Constants';
export { forceApi } from './api';
export { SObject } from './SObject';
export { UnitOfWork } from './unit-of-work';


export {
    sdk,
    SdkInterfaces
};
