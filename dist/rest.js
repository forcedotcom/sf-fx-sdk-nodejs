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
        server.use(restify.plugins.jsonBodyParser());
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
        server.post('/invoke', async (req, res, next) => {
            try {
                const payload = JSON.parse(req.body);
                const context = await sdk.Context.create(payload, logger);
                const name = 'http';
                const result = await this.fx.invoke(new sdk.Event(name, context, payload.payload));
                res.send(200, result);
            }
            catch (err) {
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