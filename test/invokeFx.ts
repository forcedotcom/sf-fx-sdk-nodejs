// FOR DEVELOPMENT AND TESTING

import { invoke, sdk } from '../lib';

class FakeFunction implements sdk.SfFunction {

    public getName() {
        return this.constructor.name;
    }

    public init(config: sdk.Config, logger: sdk.Logger): Promise<any> {
        console.log('init');
        return Promise.resolve(`${this.getName()}.init`);
    }

    public invoke(context: sdk.Context, event: sdk.SfCloudevent): Promise<any> {
        console.log('invoke');
        return Promise.resolve(`${this.getName()}.invoke`);
    }
};

console.log('invoking...');
invoke(new FakeFunction());