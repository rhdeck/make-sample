const fs = require("fs");
const Path = require("path");
const recursive = require("recursive-copy");
const cp = require("child_process");
const yarnif = require("yarnif");
function makeSampleApp(dependency, basePath) {
  if (basePath) process.chdir(basePath);
  basePath = process.cwd();
  const packagePath = basePath + "/package.json";
  const package = JSON.parse(
    fs.readFileSync(packagePath, { encoding: "utf8" })
  );
  var dependencyBase;
  if (!package) {
    console.log("This is not a valid npm package directory", basePath);
    return false;
  }
  if (fs.existsSync(basePath + "/node_modules/" + dependency)) {
    dependencyBase = dependency;
  } else {
    //Look up dependencies
    if (package.dependencies) {
      Object.keys(package.dependencies).forEach(key => {
        const val = package.dependencies[key];
        if (val == dependency) {
          dependencyBase = key;
        }
      });
    }
    if (!dependencyBase) {
      if (package.devDependencies) {
        Object.keys(package.devDependencies).forEach(key => {
          const val = package.devDependencies[key];
          if (val == dependency) {
            dependencyBase = key;
          }
        });
      }
    }
  }
  const dependencyPath = basePath + "/node_modules/" + dependencyBase;
  if (!dependencyBase || !fs.existsSync(dependencyPath)) {
    yarnif.addDevDependency(dependency);
    return makeSampleApp(dependency, basePath);
  }
  const depPackagePath = dependencyPath + "/package.json";
  var path = dependencyPath + "/sampleapp/";
  if (!fs.existsSync(depPackagePath) && !fs.existsSync(path)) {
    //Then this is the sample
    path = dependencyPath;
  } else {
    //Open the package
    const depPackage = require(depPackagePath);
    var sampleApp = depPackage.sampleApp;
    if (typeof sampleApp === "string") {
      sampleApp = { path: sampleApp };
    }
    if (typeof sampleApp === "object") {
      if (sampleApp.path && sampleApp.path.length) {
        path = dependencyPath + "/" + sampleApp.path;
      } else if (sampleApp.module) {
        return makeSampleApp(sampleApp.module);
      }
    } else {
      path = dependencyPath;
    }
  }
  if (!fs.existsSync(path)) {
    console.log("The sampleapp path does not exist here:", path);
    return false;
  }
  //let's scoop it all up and copy it into local scope
  var destobj = package;
  var newJSON;
  const srcPackagePath = path + "/package.json";
  if (fs.existsSync(srcPackagePath)) {
    const srcPackage = require(srcPackagePath);
    const safekeys = ["name", "license", "version", "author", "private"];
    Object.keys(srcPackage).forEach(key => {
      if (safekeys.indexOf(key) != -1) return;
      if (!destobj[key]) {
        destobj[key] = srcPackage[key];
      } else if (
        srcPackage[key] &&
        typeof srcPackage[key] === "object" &&
        srcPackage[key].constructor === Object
      ) {
        console.log("This is an object", key);
        const destKeys = Object.keys(destobj[key]);
        const srcKeys = Object.keys(srcPackage[key]);
        srcKeys.forEach(subKey => {
          if (destKeys.indexOf(subKey) === -1) {
            console.log("Adding member", subKey, key);
            destobj[key][subKey] = srcPackage[key][subKey];
          }
        });
      } else if (srcPackage[key] && typeof srcPackage[key] === "array") {
        console.log("This is an array", key);
        if (typeof destobj[key] !== "array") {
          destobj[key] = srcPackage[key];
        } else {
          srcPackage[key].forEach(value => {
            if (destobj[key].indexOf(value) === -1) {
              destobj[key].push(value);
              console.log("Appending value", value, key);
            }
          });
        }
      } else {
        console.log("Straight overwriting ", key);
        destobj[key] = srcPackage[key];
      }
    });
    newJSON = JSON.stringify(destobj, null, 2);
  }
  fs.writeFileSync(packagePath, newJSON);
  console.log("Executing initial install");
  yarnif.install();
  console.log("Initial install complete");
  console.log("Starting preInstall checks");
  if (destobj.sampleApp && destobj.sampleApp.preInstall) {
    runCommand(destobj.sampleApp.preInstall);
  } else {
    if (destobj.dependencies) {
      Object.keys(destobj.dependencies).forEach(doPreInstall);
    }
    if (destobj.devDependencies) {
      Object.keys(destobj.devDependencies).forEach(doPreInstall);
    }
  }
  console.log("PreInstall complete");
  recursive(path, ".", {
    overwrite: true,
    filter: ["**/*", "!package.json"]
  }).then(results => {
    console.log("Copied the following files", results);
    console.log("Completed generation with", dependency);
    // fs.writeFileSync(packagePath, newJSON);
    // yarnif.install();
    if (destobj.sampleApp && destobj.sampleApp.postInstall) {
      runCommand(destObj.sampleApp.postInstall);
    } else {
      if (destobj.dependencies) {
        Object.keys(destobj.dependencies).forEach(doPostInstall);
      }
      if (destobj.devDependencies) {
        Object.keys(destobj.devDependencies).forEach(doPostInstall);
      }
    }
  });
}
function doPreInstall(key) {
  return doSampleAppCommand(key, "preInstall");
}
function doPostInstall(key) {
  return doSampleAppCommand(key, "postInstall");
}
function doSampleAppCommand(dependencyKey, subKey) {
  const path = Path.resolve(
    process.cwd(),
    "node_modules",
    dependencyKey,
    "package.json"
  );
  if (fs.existsSync(path)) {
    const package = JSON.parse(fs.readFileSync(path));
    if (package.sampleApp && package.sampleApp[subKey]) {
      runCommand(package.sampleApp[subKey]);
    }
  }
}
function runCommand(command) {
  const commands = command.split(";");
  commands.forEach(subCommand => {
    const words = subCommand.split(" ");
    const cmd = words[0];
    const args = words.slice(1, words.length);
    console.log("Starting command ", subCommand);
    cp.spawnSync(cmd, args, { stdio: "inherit" });
    console.log("Finished", subCommand);
  });
}
module.exports = makeSampleApp;
