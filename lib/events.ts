/**
 * Configures Kafka Consumer.
 *
 * REVIEWME: Consider Heroku's no-kafka (https://www.npmjs.com/package/@heroku/no-kafka?activeTab=readme#simpleconsumer)
 */

import * as fs from 'fs';
import * as kafka from 'node-rdkafka';
import * as path from 'path';
import * as sdk from './sf-sdk';

const valueSeparator = /[,\s]+/;
const defaultKafkaGroupId = 'salesforce-data-connector';

export default class EventManager {
    public brokers: string;
    public consumer: any;

    constructor(private config: sdk.Config, private logger: sdk.Logger, private fx: sdk.SfFunction) {
        const brokerUrls = this.config.getBrokerUrls();
        if (brokerUrls == null) {
            throw new Error('Requires KAFKA_URL env var');
        }

        this.brokers = brokerUrls
            .split(/\s*,\s*/)
            .map(v => {
                const parts = /^kafka\+ssl:\/\/(.+)/.exec(v);
                return parts != null && parts.length > 0 ? parts[1] : v;
            })
            .join(',');

        this.logger.log(`kafka+ssl brokers ${this.brokers}`);

        this.initConsumer();
    }

    private initConsumer() {
        this.logger.log('Initializing Kafka consumer...');

        const prefix = this.config.getEventPrefix() || '';
        const groupId = `${prefix}${this.config.getEventGroupId() || defaultKafkaGroupId}`;
        let kafkaConfig: any = {
            'api.version.request': true,
            'client.id': `${defaultKafkaGroupId}/${this.config.getDyno() || 'localhost'}`,
            'enable.auto.commit': false,
            event_cb: true,
            'group.id': groupId,
            'metadata.broker.list': this.brokers
        };

        const hasCertConfigs = this.config.hasCertConfig();
        if (hasCertConfigs) {
            this.logger.log('Applying cert config');

            const certsDir = '.certs';
            if (!fs.existsSync(certsDir)){
                fs.mkdirSync(certsDir);
            }
            const trustedCert = path.join(certsDir, 'KAFKA_TRUSTED_CERT');
            fs.writeFileSync(trustedCert, this.config.getBrokerTrustedCert());
            this.logger.debug(`Wrote ${trustedCert}`);
            const clientCert = path.join(certsDir, 'KAFKA_CLIENT_CERT');
            fs.writeFileSync(clientCert, this.config.getBrokerClientCert());
            this.logger.debug(`Wrote ${clientCert}`);
            const clientCertKey = path.join(certsDir, 'KAFKA_CLIENT_CERT_KEY');
            fs.writeFileSync(clientCertKey, this.config.getBrokerClientCertKey());
            this.logger.debug(`Wrote ${clientCertKey}`);

            kafkaConfig = kafkaConfig.assign(kafkaConfig, {
                'security.protocol': 'SSL',
                // SSL certs written above to .cert/
                'ssl.ca.location': trustedCert,
                'ssl.certificate.location': clientCert,
                'ssl.key.location': clientCertKey,
            });
        }

        if (this.config.isFinest()) {
            kafkaConfig['debug'] = 'all';
        }
        this.consumer = new kafka.KafkaConsumer(kafkaConfig, {});

        const eventNamesStr = this.config.getEventNames();
        const topicNames = eventNamesStr && eventNamesStr.length > 0 ? eventNamesStr.split(valueSeparator) : [];

        if (topicNames.length < 1) {
            throw new Error('Requires array of topicNames.');
        }

        // TODO: query provider to get a list of available topics and cross-ref
        // against given subscribe-to topics to ensure (a) topic's viability  and
        // (b) correct casing (topics are case-sensitive)
        const kafkaTopics = topicNames.map(topic =>
            // connect event topics are lowercase
            `${prefix}${topic.toLowerCase()}`);
        this.logger.shout(
            `Consuming Kafka ${kafkaTopics.length === 1 ? 'topic' : 'topics'}: ${kafkaTopics.join(
                ', ',
            )}; group: ${groupId}`,
        );
        // REVIEWME: this is only needed for shared kafka clusters, but customers may
        // not know about share vs. dedicated so, ignoring for now...
        //this.logger.log(`Ensure that group '${groupId}' is an active consumer group`);

        const connectTimeout = this.config.getBrokerTimeout();
        const connectTimoutFx = setTimeout(() => {
            const message = `Failed to connect Kafka consumer (${connectTimeout}-ms timeout)`;
            throw new Error(message);
        }, connectTimeout);
        this.consumer.connect();

        this.consumer.on('event.log', log => {
            this.logger.log(`📋 Kafka consumer event: ${JSON.stringify(log)}`);
        });

        this.consumer.on('event.error', err => {
            this.logger.error(`!      Kafka consumer error: ${err.stack}`);
        });

        this.consumer.on('disconnected', (arg) => {
            this.logger.error(`!      Kafka consumer disconnected: ${JSON.stringify(arg)}`);
        });

        this.consumer.on('ready', (id, metadata) => {
            this.consumer.on('error', err => {
                this.logger.log(`!      Error in Kafka consumer: ${err.stack}`);
            });

            this.consumer.subscribe(kafkaTopics);
            this.consumer.consume();

            clearTimeout(connectTimoutFx);
            this.logger.log(`✅ Kafka is ready: ${id.name}`);
        });

        this.consumer.on('data', async data => {
            try {
                this.logger.log(`📨 Consume message ${data.offset} from ${data.topic}`);
                this.logger.log(`${data.value.toString('utf8')}`);

                const value = JSON.parse(data.value.toString('utf8'));
                const event = value.data;
                const context = await sdk.Context.create(event.payload, this.logger);
                const name = value.channel.substring(value.channel.lastIndexOf('/') + 1);

                // invoke function
                try {
                    await this.fx.invoke(new sdk.Event(name, context, event.payload));
                } catch (err) {
                    // REVIEWME: to commit or not?
                    this.logger.error(`!      Function error: ${err.message}`);
                    this.logger.error(`!      ${err.stack}`);
                }

                // REVIEWME: function should determine if we commit
                // the message or not
                let didCommit = false;
                const commitOnce = () => {
                    if (!didCommit) {
                        this.consumer.commitMessage(data);
                        didCommit = true;
                        this.logger.log(`📥 Commit message ${data.offset} from ${data.topic}`);
                    }
                };
            } catch (err) {
                this.logger.error(`!      Error consuming Kafka message: ${err.stack}`);
            }
        });
    }
}
