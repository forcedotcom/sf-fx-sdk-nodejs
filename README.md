# Salesforce Function SDK for Node.js

## Usage
```javascript
import { invoke, sdk } from 'salesforce-fdk';

class MyFunction implements sdk.SfFunction {

    public init(config: sdk.Config, logger: sdk.Logger): Promise<any> {
        console.log('init');
        
        // do init
        
        return Promise.resolve(null);
    }

    public invoke(context: sdk.Context, event: sdk.Cloudevent): Promise<any> {
        console.log('invoke');
        
        // do something
        
        return Promise.resolve(null);
    }
};

console.log('invoking...');
invoke(new MyFunction());
```