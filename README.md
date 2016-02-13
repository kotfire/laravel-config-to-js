# Laravel Config To Javascript

## Introduction

This package provides a clean, easy maintainable and fast way to re-use your Laravel config files on the client side (javascript). It's built to be used in a Laravel project with Gulp, but you're free to find other uses for it.

## Important

This a very early version of the project and might have errors. If you report them here, I'll be happy to fix them.

## Documentation

### Install

Install the package via npm:

``` npm install laravel-config-to-js ```

### Usage

```javascript
var buildJsConfig = require('laravel-config-to-js');

buildJSConfig(options);
```

### Options

The following options and its default values are:

```javascript
{
    configDirPath: './config',
    destFilePath: './resources/assets/js/variables.js',
    namespace: 'Config',
}
```

### How it works

The package will go through all the configuration files in your Laravel project seeking comment that contains the annotation ```@jsVariable```. If found, the contents of the following option will be transformed to javascript. Every option found in the same file will be grouped down in a object with the name of that file and each group in a namespace.

##### Here's an example:

Laravel config folder:
```
project
│   ...
└───config
    │   app.php
    │   custom.php
```
app.php contents:

```php
return [
    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | your application so that it is used when running Artisan tasks.
    |
    | @jsVariable
    */

    'url' => 'http://laravel.com',

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. We have gone
    | ahead and set this to a sensible default for you out of the box.
    |
    */

    'timezone' => 'Europe/London',

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by the translation service provider. You are free to set this value
    | to any of the locales which will be supported by the application.
    |
    */

    // @jsVariable
    'locale' => 'en',
];
```

custom.php contents:

```php
return [
    'my_important_things' => [
        'right_here' => [
            /**
             * @jsVariable
             */
            'this_key' => 'I need this on client side',
            'other_key' => 'This is private, shhhh',
        ],
    ],
];
```

Output:

```javascript
var Config = {
    "app": {
        "url": "http://www.laravel.com",
        "locale": "en"
    },
    "event": {
        "my_important_things": {
            "right_here": {
                "this_key": "I need this on client side"
            }
        }
    }
}
```

### Not supported

There are some options that can't be supported, for obvious reasons. If you try to get one of these options you will get a "not supported" as value. This is the list:

- Any function, example: ```env('APP_DEBUG', false),```
- Scope operators, example: ```Illuminate\View\ViewServiceProvider::class,```

## License

Laravel Config To Javascript is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT)