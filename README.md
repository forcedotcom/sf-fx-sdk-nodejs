[![CircleCI](https://circleci.com/gh/forcedotcom/sf-fx-sdk-nodejs.svg?style=svg&circle-token=457d98bdaefff70d43f9fa1448eef78309d14406)](https://circleci.com/gh/forcedotcom/sf-fx-sdk-nodejs)

# Salesforce Function SDK for Node.js

## Usage
```javascript
import { invoke, sdk } from 'salesforce-fdk';

export interface MyPayload {
    paramHere:  string,
    shouldDoThis: boolean
    anOptionalParam?:  string,
}

class MyFunction implements sdk.SfFunction {

    public init(config: sdk.Config, logger: sdk.Logger): Promise<any> {
        logger.log('init');
        
        // do init
        
        return Promise.resolve(null);
    }

    public invoke(context: sdk.Context, event: sdk.SfCloudevent): Promise<any> {
        logger.log('invoke');
        
        const payload: MyPayload = event.getPayload();
        // do something w/ payload
        
        return Promise.resolve(null);
    }
};

invoke(new MyFunction());
```