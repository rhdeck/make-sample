#!/usr/bin/env node
const path = require("path");
const commander = require("commander");
const makeSampleApp = require("../index.js");
const pt = require("package-template");
const fs = require("fs");
commander.arguments("<name> <dependency>");
commander.description(
  "Creates a sample app of name from the specified dependency"
);
commander.action((name, dependency) => {
  if (!dependency) {
    console.log("Usage: make-sample-app <dependency>");
    exit(1);
  }
  if (fs.existsSync(name)) {
    console.log("I cannot overwrite an existing directory");
    process.exit(1);
  }
  fs.mkdirSync(name);
  process.chdir(name);
  const package = pt.init(name);
  console.log("Hi ho my package is ", package);
  pt.write(package);
  //let's checi out that depdency
  if (dependency.startsWith(".")) {
    dependency = path.resolve(dependency);
  }
  makeSampleApp(dependency);
});
commander.parse(process.argv);
