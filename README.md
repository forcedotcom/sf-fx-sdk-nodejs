# Salesforce Function SDK for Node.js

Note: This feature is in beta and has been released early so we can collect feedback. It may contain significant problems, undergo major changes, or be discontinued. The use of this feature is governed by the [Salesforce.com Program Agreement](https://trailblazer.me/terms?lan=en).

## Usage

All function implementations must export a function accepting these arguments:

* [InvocationEvent](docs/classes/invocationevent.md) containing the payload for the function, etc.
* [Context](docs/classes/context.md) containing utility and Salesforce API classes to call back to the invoking org
* [Logger](https://forcedotcom.github.io/sfdx-core/classes/logger.html) for logging diagnostic/status messages

Functions must return an object that can be serialized to JSON.

```javascript
import * as sdk from 'salesforce-sdk';

export default async function execute(event: sdk.InvocationEvent, context: sdk.Context, logger: sdk.Logger): Promise<any> {
    debugger;

    // Invoke function
    const fx: HelloFunction = new HelloFunction(event, context, logger);
    const response = await fx.invoke();

    return JSON.stringify(response);
}


class HelloFunction {

    constructor(private readonly event: sdk.InvocationEvent,
                private readonly context: sdk.Context,
                private readonly logger: sdk.Logger) {
        this.logger = context.logger;
        this.logger.info(`${this.getName()}.init()`);
    }

    public getName(): string {
        return this.constructor.name;
    }

    public async invoke(): Promise<any>  {
        this.logger.info(`${this.getName()}.invoke()`);

        const results = await this.context.org.data.query('SELECT Name FROM Account');
        this.logger.info(JSON.stringify(query));

        return results;
    }
}
```