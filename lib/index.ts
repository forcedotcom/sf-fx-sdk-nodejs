import { CompositeApi } from './composite-api';
import { ConnectionConfig  } from './ConnectionConfig';
import { Constants } from './Constants';
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
}

export { invoke, CompositeApi, ConnectionConfig, Constants, sdk, UnitOfWork, SObject, SdkInterfaces };
