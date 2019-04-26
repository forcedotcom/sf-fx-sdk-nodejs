// FOR DEVELOPMENT AND TESTING

import { invoke, sdk } from '../lib';

class FakeFunction implements sdk.SfFunction {

    public getName() {
        return 'fakeFx';
    }

    public init(config: sdk.Config, logger: sdk.Logger): Promise<any> {
        console.log('init');
        return Promise.resolve(null);
    }

    public invoke(context: sdk.Context, event: sdk.Cloudevent): Promise<any> {
        console.log('invoke');
        return Promise.resolve(null);
    }
};

console.log('invoking...');
invoke(new FakeFunction());