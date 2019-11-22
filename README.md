[![CircleCI](https://circleci.com/gh/forcedotcom/sf-fx-sdk-nodejs.svg?style=svg&circle-token=457d98bdaefff70d43f9fa1448eef78309d14406)](https://circleci.com/gh/forcedotcom/sf-fx-sdk-nodejs)

# Salesforce Function SDK for Node.js

## Usage
```javascript
import * as sdk from 'salesforce-sdk';

export default class HelloFunction {

    private readonly logger: sdk.Logger;

    constructor(private readonly event: any,
                private readonly context: sdk.Context) {
        this.logger = context.logger;
        this.logger.shout(`${this.getName()}.init()`);
    }

    public getName(): string {
        return this.constructor.name;
    }

    public async invoke(): Promise<any>  {
        this.logger.shout(`${this.getName()}.invoke()`);

        const results = await this.context.forceApi.query('SELECT Name FROM Account');
        this.logger.info(JSON.stringify(query));

        return results;
    }
}
```

## Publish salesforce-sdk

`salesforce-sdk` is published to [https://www.npmjs.com/package/@heroku/salesforce-sdk](https://www.npmjs.com/package/@heroku/salesforce-sdk).

Note: Requires access to `@heroku/salesforce-sdk`.

To publish to `@heroku/salesforce-sdk`:

1. Ensure you have latest source locally.
```bash
git pull
...
```

2. Build & test.
```bash
npm run build
...

npm run test
...
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
np 0.0.18-develop.1 --no-release-draft --tag=develop.1 --any-branch
```

5. Test and push to repo.
```bash
npm install
...

git commit -a -m "<updated-version>"
...

git push
...
```

TODO: Decide when to `git-tag` version.