/**
 * Configures Kafka Consumer.
 *
 * REVIEWME: Consider Heroku's no-kafka (https://www.npmjs.com/package/@heroku/no-kafka?activeTab=readme#simpleconsumer)
 */
import * as sdk from './sf-sdk';
export default class EventManager {
    private config;
    private logger;
    private fx;
    brokers: string;
    consumer: any;
    constructor(config: sdk.Config, logger: sdk.Logger, fx: sdk.SfFunction);
    private initConsumer;
}
