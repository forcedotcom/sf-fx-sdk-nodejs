import * as sdk from './sf-sdk';
import * as restify from 'restify';
import * as restifyPromise from 'restify-await-promise';

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

        //Allows you to manipulate the errors before restify does its work
        const alwaysBlameTheUserErrorTransformer = {
            transform: function(exceptionThrownByRoute) {
                //Always blame the user
                exceptionThrownByRoute.statusCode = 400;
                return exceptionThrownByRoute;
            },
        };

        const options = {
            logger: this.logger, //Optional: Will automatically log exceptions
            errorTransformer: alwaysBlameTheUserErrorTransformer, //Optional: Lets you add status codes
        };

        restifyPromise.install(server, options); // Options is not required

        server.get(
            '/',
            async (req: any, res: any, next: Function): Promise<any> => {
                res.send(200, `Function '${this.fx.getName()}' is ready for service!`);
                return next(false);
            },
        );

        server.post(
            '/invoke',
            async (req: any, res: any, next: Function): Promise<any> => {
                const payload = req.body;

                try {
                    const context = await sdk.Context.create(payload, logger);
                    const name = 'http';
                    const result = await this.fx.invoke(new sdk.Event(name, context, payload));
                    res.send(200, result);
                } catch (err) {
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
