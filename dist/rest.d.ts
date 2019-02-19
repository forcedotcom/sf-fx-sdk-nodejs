import * as sdk from './sf-sdk';
export default class RestManager {
    private config;
    private logger;
    private fx;
    constructor(config: sdk.Config, logger: sdk.Logger, fx: sdk.SfFunction);
    private get_auth_rest_url;
    private get_auth_token_url;
    private initServer;
}
