import * as sdk from './sf-sdk';

export async function invoke(fx: sdk.SfFunction) {
    // Setup
    const config = new sdk.Config();
    const logger = sdk.Logger.create(config.isVerbose());

    try {
        // Init function
        await fx.init(config, logger);

        // Create and validate Cloudevent
        const eventPayload: any = JSON.parse(process.env.SF_FX_PAYLOAD);
        const cloudEvent: sdk.SfCloudevent = new sdk.SfCloudevent(eventPayload);
        cloudEvent.check();

        // Setup context
        const context = await sdk.Context.create(cloudEvent.getData(), logger);

        // Invoke function
        await fx.invoke(context, cloudEvent);
    } catch (err) {
        logger.error(err.message, err);
    }
}

export { CompositeApi } from './composite-api';
export { ConnectionConfig } from './ConnectionConfig';
export { Constants } from './Constants';
export * from './api';
export * from './Interfaces';
export { SObject } from './SObject';
export { UnitOfWork } from './unit-of-work';
export { sdk };
