import * as SdkInterfaces from './Interfaces';
import * as sdk from './sf-sdk';

export async function invoke(fx: sdk.SfFunction) {
    console.log('Invoke called');
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());
    try {
        const sfFxPayload = JSON.parse(process.env.SF_FX_PAYLOAD);

        await fx.init(config, logger);

        const context = await sdk.Context.create(sfFxPayload, logger);
        const name = 'cmd';
        await fx.invoke(new sdk.Event(name, context, sfFxPayload.payload));
    } catch (err) {
        logger.error(`Error: ${err}`);
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
