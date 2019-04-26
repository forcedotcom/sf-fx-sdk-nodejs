import * as sdk from './sf-sdk';

export async function invoke(fx: sdk.SfFunction) {

    // Setup
    const config = new sdk.Config();
    const logger = sdk.logInit(config.isVerbose());

    try {
        // Create and validate Cloudevent
        const sfFxPayload = JSON.parse(process.env.SF_FX_PAYLOAD);
        const cloudEvent: sdk.Cloudevent = new sdk.Cloudevent(sdk.Cloudevent.specs['0.2']);
        cloudEvent.spec.payload = Object.assign(cloudEvent.spec.payload, sfFxPayload);
        cloudEvent.spec.check();

        // Setup context
        const context = await sdk.Context.create(cloudEvent.getData(), logger);

        // Init function
        await fx.init(config, logger);


        // Invoke function
        await fx.invoke(context, cloudEvent);

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
export { sdk };
