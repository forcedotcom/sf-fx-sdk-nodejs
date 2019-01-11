"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk = require("./sf-sdk");
const restify = require("restify");
const restifyPromise = require("restify-await-promise");
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
        //Allows you to manipulate the errors before restify does its work
        const alwaysBlameTheUserErrorTransformer = {
            transform: function (exceptionThrownByRoute) {
                //Always blame the user
                exceptionThrownByRoute.statusCode = 400;
                return exceptionThrownByRoute;
            },
        };
        const options = {
            logger: this.logger,
            errorTransformer: alwaysBlameTheUserErrorTransformer,
        };
        restifyPromise.install(server, options); // Options is not required
        server.post('/invoke', async (req, res, next) => {
            const payload = req.body;
            try {
                const context = await sdk.Context.create(payload, logger);
                const name = 'http';
                const result = await this.fx.invoke(new sdk.Event(name, context, payload));
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