"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify");
const restifyPromise = require("restify-await-promise");
const sdk = require("./sf-sdk");
class RestManager {
    constructor(config, logger, fx) {
        this.config = config;
        this.logger = logger;
        this.fx = fx;
        this.initServer();
    }
    initServer() {
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
            errorTransformer: alwaysBlameTheUserErrorTransformer,
            logger: this.logger,
        };
        restifyPromise.install(server, options); // Options is not required
        server.get('/', async (req, res, next) => {
            res.send(200, `Function '${this.fx.getName()}' is ready for service!`);
            return next(false);
        });
        /*  Example body sent from the dispatcher
{
    "id":"00Dxx0000006GoF-0cXxx000000000H",
    "functionName":"salesforce.pdf_creator_function_invoke__e",
    "context":{
        "userContext":{
            "orgId":"00Dxx0000006GoF",
            "userId":"005xx000001X7dl",
            "username":"chris@sffx.org",
            "salesforceBaseUrl":"http://sffx-dev-ed.localhost.internal.salesforce.com:6109",
            "orgDomainUrl":"http://sffx-dev-ed.localhost.internal.salesforce.com:6109",
            "sessionId":"00Dxx0000006GoF!AQEAQBRrFr2zwFCWTwzCHmFWdzzQ7j8PZM1.5FBRbw3i8LCfo1IankJupmEgUXML4usfVizeupD8OCimPWOKzKGdNUHUQQ.F"
        },
        "apiVersion":"46.0",
        "functionInvocationId":"9mdxx00000000Mb"
    },
    "payload":{  // custom function payload
        "url":"https://google.com",
        "html":null,
        "isLightning":false
    }
}
        */
        server.post('/invoke', async (req, res, next) => {
            const body = req.body;
            try {
                const context = await sdk.Context.create(body, logger);
                const name = 'http';
                const result = await this.fx.invoke(new sdk.Event(name, context, body.payload));
                res.send(200, result);
            }
            catch (err) {
                logger.error(`Error: ${err}`);
                res.send(500, err.message);
            }
            return next(false);
        });
        server.listen(this.config.getPort(), () => {
            logger.log(`${server.name} listening at ${server.url}`);
        });
    }
}
exports.default = RestManager;
//# sourceMappingURL=rest.js.map