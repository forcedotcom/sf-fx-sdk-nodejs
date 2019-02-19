"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require("restify");
const restifyPromise = require("restify-await-promise");
const request = require("request");
const sdk = require("./sf-sdk");
class RestManager {
    constructor(config, logger, fx) {
        this.config = config;
        this.logger = logger;
        this.fx = fx;
        this.initServer();
    }
    get_auth_rest_url() {
        return `https://cs46.salesforce.com/services/oauth2/authorize?` +
            `response_type=code&` +
            `client_id=${process.env.FUNCTION_CONSUMER_KEY}&` +
            `client_secret=${process.env.FUNCTION_CONSUMER_SECRET}&` +
            `redirect_uri=${encodeURIComponent(process.env.FUNCTION_CALLBACK)}`;
    }
    get_auth_token_url() {
        return 'https://cs46.salesforce.com/services/oauth2/token';
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
        server.get('/oauthrequest', async (req, res, next) => {
            res.redirect(this.get_auth_rest_url());
        });
        server.get('/oauthcallback', async (req, res, next) => {
            request({
                url: this.get_auth_token_url(),
                method: 'POST',
                form: {
                    grant_type: "authorization_code",
                    client_id: process.env.FUNCTION_CONSUMER_KEY,
                    client_secret: process.env.FUNCTION_CONSUMER_SECRET,
                    redirect_uri: process.env.FUNCTION_CALLBACK,
                    code: req.query.code,
                    format: "json"
                }
            }, async (err, res, next) => {
                if (err) {
                    res.send(err);
                    return next(false);
                }
                const oauth = JSON.parse(res.body);
                this.fx.setOAuthToken(oauth);
                return next(false);
            });
        });
        server.listen(this.config.getPort(), () => {
            logger.log(`${server.name} listening at ${server.url}`);
        });
    }
}
exports.default = RestManager;
//# sourceMappingURL=rest.js.map