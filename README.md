# angular-cache-webpack5

[![npm][npm]][npm-url]
![npm](https://img.shields.io/npm/dw/angular-cache-webpack5.svg)
[![license](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://npmjs.org/package/angular-cache-webpack5)

> Speed up your AngularJS app by automatically combining, concatenating, registering and caching your AngularJS HTML templates in the `$templateCache`.

[Install](#install) | [Usage](#usage) | [Options and Defaults](#options-and-defaults) | [License](#license)

---

Extended from https://github.com/rafaelmussi/angular-templatecache-webpack-plugin

#### :warning: If you are a **`Laravel` user**, check out this [laravel mix package](https://github.com/rafaelmussi/laravel-mix-angular-templatecache) :warning:

---

## Install

Install with [npm](https://www.npmjs.com/package/angular-cache-webpack5) or [yarn](https://yarnpkg.com/package/angular-cache-webpack5)

```bash
  npm i --save angular-cache-webpack5
```

```bash
  yarn add angular-cache-webpack5
```

## Usage

This [webpack](http://webpack.js.org/) plugin will combine all your angular `.html` templates and save to dist/templates.js (default filename). Just add the plugin to your `webpack` config as follows:

**webpack.config.js**

```js
const AngularTemplateCacheWebpackPlugin = require('angular-cache-webpack5')

module.exports = {
	plugins: [
		new AngularTemplateCacheWebpackPlugin({
			source: 'templates/**/*.html',
			/**
			 * See options and defaults below for more details
			 */
		}),
	],
}
```

This will generate a file `dist/templates.js` containing the following:

> :information*source: Sample output (\_prettified*).

```js
angular.module('templates').run([
	$templateCache,
	function ($templateCache) {
		$templateCache.put(
			'template-file-01.html'
			// content of template-file-01.html (escaped)
		)
		$templateCache.put(
			'template-file-02.html'
			// content of template-file-02.html (escaped)
		)
		// etc...
	},
])
```

Include this file in your app and AngularJS will use the $templateCache when available.

> :information_source: This plugin will **NOT** create a new AngularJS module by default, but use a module called `templates`. If you want to create a new module, set `options.standalone` to `true`.

### Options and Defaults

| Name             | Type        | Default                            | Description                                                                                                                          |
| ---------------- | ----------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `source`         | `{String}`  | `undefined`                        | Your html templates path/folder. You can also use [glob](https://github.com/isaacs/node-glob#readme) patterns to use multiple files. |
| `outputFilename` | `{String}`  | `'dist/templates.js'`              | The path/filename.js where the output file should be saved.                                                                          |
| `root`           | `{String}`  | `undefined`                        | Prefix for template URLs.                                                                                                            |
| `module`         | `{String}`  | `'templates'`                      | Name of the existing AngularJS module.                                                                                               |
| `standalone`     | `{Boolean}` | `false`                            | Create a new AngularJS module, instead of using an existing one.                                                                     |
| `escapeOptions ` | `{Object}`  | {}                                 | An object with jsesc-options. See [jsesc](https://www.npmjs.com/package/jsesc#api) for more information.                             |
| `templateHeader` | `{String}`  | [`*See below`](#default-templates) | Override template header.                                                                                                            |
| `templateBody`   | `{String}`  | [`*See below`](#default-templates) | Override template body.                                                                                                              |
| `templateFooter` | `{String}`  | [`*See below`](#default-templates) | Override template footer.                                                                                                            |

### Default Templates

> `templateHeader:`
>
> ```js
> 'angular.module("<%= module %>"<%= standalone %>).run(["$templateCache", function($templateCache) {'
> ```
>
> ---
>
> `templateBody:`
>
> ```js
> '$templateCache.put("<%= url %>","<%= contents %>");'
> ```
>
> ---
>
> `templateFooter:`
>
> ```js
> '}]);'
> ```

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/angular-cache-webpack5.svg
[npm-url]: https://npmjs.com/package/angular-cache-webpack5
