[![CircleCI](https://circleci.com/gh/forcedotcom/sf-fx-sdk-nodejs.svg?style=svg&circle-token=457d98bdaefff70d43f9fa1448eef78309d14406)](https://circleci.com/gh/forcedotcom/sf-fx-sdk-nodejs)

# Salesforce Function SDK for Node.js

## Usage
```javascript
import * as sdk from 'salesforce-sdk';

export default class HelloFunction {

    constructor(private readonly config: sdk.Config,  // REVIEWME: Needed?
                private readonly context: sdk.Context,
                private readonly logger: sdk.Logger,
                private readonly event: sdk.SfCloudevent) {
        this.logger.shout(`${this.getName()}.init()`);
    }

    public async invoke(): Promise<any>  {
        this.logger.shout(`${this.getName()}.invoke()`);

        const results = await this.context.forceApi.query('SELECT Name FROM Account');
        this.logger.info(JSON.stringify(query));

        return results;
    }
}
```