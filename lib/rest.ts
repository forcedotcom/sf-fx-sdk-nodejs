import * as restify from 'restify';
import * as restifyPromise from 'restify-await-promise';
import * as sdk from './sf-sdk';

export default class RestManager {
    constructor(private config: sdk.Config, private logger: sdk.Logger, private fx: sdk.SfFunction) {
        this.initServer();
    }

    private initServer(): void {
        const logger = this.logger;

        const server = restify.createServer({
            name: this.fx.getName(),
            version: '1.0.0',
        });
        server.pre(restify.plugins.pre.userAgentConnection());
        server.use(restify.plugins.queryParser());
        server.use(restify.plugins.bodyParser());

        // Allows you to manipulate the errors before restify does its work
        const alwaysBlameTheUserErrorTransformer = {
            transform: (exceptionThrownByRoute) => {
                // Always blame the user
                exceptionThrownByRoute.statusCode = 400;
                return exceptionThrownByRoute;
            },
        };

        const options = {
            errorTransformer: alwaysBlameTheUserErrorTransformer, // Optional: Lets you add status codes
            logger: this.logger, // Optional: Will automatically log exceptions
        };

        restifyPromise.install(server, options); // Options is not required

        server.get(
            '/',
            async (req: any, res: any, next: Function): Promise<any> => {
                res.send(200, `Function '${this.fx.getName()}' is ready for service!`);
                return next(false);
            },
        );

        /*  Example body sent from the dispatcher
            {
                "context": { 
                    "userContext": { 
                        "orgId": "00Dxx0000002967", 
                        "userId": "005xx000001WZtP", 
                        "username": "admin@9158457974503.com", 
                        "salesforceBaseUrl": "http://jbartolott-wsl1.internal.salesforce.com:6109", 
                        "orgDomainUrl": null, "sessionId": "00Dxx0000002967!AQcAQGp3QNDZkXyaD8n0CIhKWXnpudTACB_2S3Nq4Hn5aMBuz8RJGhGGSSDZn2X.96_DBs7hSY2K4cEP45a7jlJAP2C_yR7F" }, 
                        "apiVersion": "46.0", "functionInvocationId": "9mdxx000000001Y" 
                    }, 
                    "payload": { "Account_ID__c": "001xx000003EHKn" } 
                } 
            }
        */
        server.post(
            '/invoke',
            async (req: any, res: any, next: Function): Promise<any> => {
                const body = req.body;

                try {
                    const context = await sdk.Context.create(body, logger);
                    const name = 'http';
                    const result = await this.fx.invoke(new sdk.Event(name, context, body.payload));
                    res.send(200, result);
                } catch (err) {
                    logger.error(`Error: ${err}`);
                    res.send(500, err.message);
                }

                return next(false);
            },
        );

        server.listen(this.config.getPort(), () => {
            logger.log(`${server.name} listening at ${server.url}`);
        });
    }
}
