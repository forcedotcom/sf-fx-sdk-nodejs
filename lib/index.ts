import { CompositeApi } from './composite-api';
import { ConnectionConfig  } from './ConnectionConfig';
import { Constants } from './Constants';
import EventManager from './events';
import * as SdkInterfaces from './Interfaces';
import RestManager from './rest';
import * as sdk from './sf-sdk';
import { SObject } from './SObject';
import { UnitOfWork } from './unit-of-work';

async function invoke(fx: sdk.SfFunction) {
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

export {
    invoke,
    CompositeApi,
    ConnectionConfig,
    Constants,
    sdk,
    UnitOfWork,
    SObject,
    SdkInterfaces
};
