# @fundamend/plugin-vitest-easy-snapshot

_plugin-vitest-easy-snapshot_ is a helper module for [vitest] used by the [fundamend.dev] ecosystem.
It allows you to easily take file and image snapshots of any number of HTML elements on a page.

## Installation

Use your favorite Node.js package manager, for example [npm], like so:

    npm install --save-dev @fundamend/plugin-vitest-easy-snapshot

... or [yarn], like so:

    yarn add --dev @fundamend/plugin-vitest-easy-snapshot

## Usage

In your `test.js`, import _plugin-vitest-easy-snapshot_ and capture snapshots of any number of elements, like so:

```js
import run from '@fundamend/plugin-vitest-easy-snapshot';

run({
	url: 'http://localhost:1234',
	elements: [
		'data-test-id-1',
		'data-test-id-2',
		'data-test-id-3'
	]
});
```

- `url` is the URL of the server, where the page you want to test can be reached.
- `elements` is an array of HTML elements for which you want to generate file and image snapshots.

## License

[MIT]

[vitest]: https://vitest.dev/
[fundamend.dev]: https://fundamend.dev
[mit]: https://choosealicense.com/licenses/mit/
[npm]: https://www.npmjs.com/
[yarn]: https://yarnpkg.com/
