# react-native-make-demo-app

Utility to easily create sample modules/projects/apps based on hints from
existing modules.

# Installation

```
yarn global add make-sample
```

OR

```
npm i g make-sample
```

# Usage

**Note** The package installs the same executable under the aliases `ms` and
`make-sample`.

```
ms myproject mybase
```

This will create a new template project in the directory `./myproject` loading
up the sample code in `mybase` but preserving your project name and a base
version.

# Making sample projects

## Method 1: Define a /sampleapp directory in your project

If you create files (including a package.json) in a directory called sampleapp
of your module, that code will get copied to the new templated sample. The
exeption is package.json, for which the author, version and name will not get
rebased.

This is probably the easiest way to get started.

## Method 2: Create a separate project with nothing but sample code

All you need to do is specify this project using usual npm syntax (e.g. path,
URI, github reference, NPM package name) and it will work. Example:

```
ms rnas rhdeck/react-native-arkit-sample
```

## Method 3: Specify a module containing your sample code in your project

Edit your package.json for this.
[Example here.](https://github.com/rhdeck/react-native-arkit/blob/master/package.json)

```
"name":"Hithere",
"sampleApp":{"module":"rhdeck/react-native-arkit-sample"},
...
```

Then you get the benefits of simple pointing with the isolation of your sample
in a separate application!

## Method 4: Specify a different subdirectory with your sample code

If you want your sample code elsewhere in your tree, specify the path member of
sampleApp instead:

```
"name":"Hithere",
"sampleApp":{"path":"sampleapp"}
```

This seems more a corner case, but here to cover the corners!

# Events

When you install your app, there will be five phases:

1. Merging the package.json
2. Running the initial install (npm i or yarn add, depending on which you have,
   thanks to [yarnif](https://npmjs.com/yarnif))
3. Pre-installation - running the sampleApp.preInstall commands specified in
   either your sample project or any dependencies installed in phase (2).
4. Copy your other sample files
5. Post-installation - running the sampleApp.postInstall commands.

See [react-native-sample](https://github.com/rhdeck/react-native-sample) for
examples of how you can use preInstall and postInstall to take care of setup and
preparation for use. In that case, it initializes the react-native "hello world"
project in pre-install, so your override application code goes on top of it, and
runs `react-native link` on the back, to take care of any native modules that
got installed in the course of building the sample.
