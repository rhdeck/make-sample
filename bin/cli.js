#!/usr/bin/env node
const commander = require("commander");
const makeSampleApp = require("../index.js");
const pt = require("package-template");
const fs = require("fs");
commander.arguments("<name> <dependency>");
commander.description("Creates a sample app from the specified dependency");
commander.action(args => {
  const name = args[0];
  const dependency = args[1];
  if (!dependency) {
    console.log("Usage: make-sample-app <dependency>");
    exit(1);
  }
  fs.mkdirSync(name);
  process.chdir(name);
  pt.write(pt.init(name));
  makeSampleApp(process.argv[2]);
});
commander.parse(process.argv);
