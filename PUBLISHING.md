## Publish salesforce-sdk

`salesforce-sdk` is published to [https://www.npmjs.com/package/@salesforce/salesforce-sdk](https://www.npmjs.com/package/@salesforce/salesforce-sdk).

Note: Requires access to `@salesforce/salesforce-sdk`.  Invoke `npm login` to publish.

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