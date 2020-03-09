[![CircleCI](https://circleci.com/gh/forcedotcom/sf-fx-sdk-nodejs.svg?style=svg&circle-token=457d98bdaefff70d43f9fa1448eef78309d14406)](https://circleci.com/gh/forcedotcom/sf-fx-sdk-nodejs)

# Salesforce Function SDK for Node.js

Note: This feature is in beta and has been released early so we can collect feedback. It may contain significant problems, undergo major changes, or be discontinued. The use of this feature is governed by the [Salesforce.com Program Agreement](https://trailblazer.me/terms?lan=en).

## Usage
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

## Publish salesforce-sdk

`salesforce-sdk` is published to [https://www.npmjs.com/package/@salesforce/salesforce-sdk](https://www.npmjs.com/package/@salesforce/salesforce-sdk).

Note: Requires access to `@salesforce/salesforce-sdk`.

To publish to `@salesforce/salesforce-sdk`:

1. Ensure you have latest source locally.
```bash
git pull
...
```

2. Install, build & test.
```bash
yarn install
...

yarn test
...
  134 passing (176ms)

...
$ eslint src --ext .ts
Done in 11.43s.

```

Ensure that code coverage meets standards.


3. Increment version in `package.json`.

If applicable, can use `npm version`.

TODO: Decide when to `git-tag` version.

4. Publish to `npmjs.com`.
```bash
npm publish
...
```

May use `np`, eg:
```bash
np 1.0.1 --no-release-draft --tag=1.0.1 --any-branch
```

5. Test and push to repo.
```bash
yarn install
...

git commit -a -m "<updated-version>"
...

git push
...
```

TODO: Decide when to `git-tag` version.
