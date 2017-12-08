const fs = require("fs");
const recursive = require("recursive-copy");
const cp = require("child_process");
const yarnif = requrie("yarnif");
function makeSampleApp(dependency, basePath) {
  if (basePath) process.chdir(basePath);
  const basePath = process.cwd();
  const packagePath = basePath + "/package.json";
  const package = require(packagePath);

  if (!package) {
    console.log("This is not a valid npm package directory", basePath);
    return false;
  }
  const dependencyPath = basePath + "/node_modules/" + dependency;
  if (!fs.existsSync(dependencyPath)) {
    console.log(
      "This dependency does not exist or is not installed",
      dependency
    );
    yarnif.addDevDependency(dependency);
    return false;
  }
  const depPackagePath = dependencyPath + "/package.json";
  var path = dependencyPath + "/sampleapp/";
  if (!fs.existsSync(depPackagePath && !fs.existsSync(path))) {
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

  recursive(path, ".", {
    overwrite: true
  }).then(() => {
    console.log("Completed generation with", dependency);
    fs.writeFileSync(packagePath, newJSON);
    yarnif.install();
    if (destobj.sampleApp && destobj.sampleApp.postInstall) {
      cp.spawnSync(destobj.sampleApp.postInstall, { stdio: "inherit" });
    }
  });
}
module.exports = makeSampleApp;
