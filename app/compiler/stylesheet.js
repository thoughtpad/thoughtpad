var fs = require('co-fs'),
    fsp = require('co-fs-plus'),
    logger = require('./../logger'),
    fileWriter = require('thoughtpad-fileWriter');

var preCompileRequest = function *(thoughtpad, compScripts) {
    var i = 0,
        j = 1,
        len,
        splits,
        ext,
        contents,
        name;

    scripts = yield fsp.readdir(thoughtpad.folders.stylesheets, null, []);
    len = scripts.length;

    // Here is the opportunity to add any extra scripts at runtime
    thoughtpad.subscribe("css-precompile-complete", function *(res) {
        compScripts[res.name] = {
            contents: res.contents,
            ext: res.ext
        };
        logger.clearCompiler("  Adding " + j + " extra css files");
        j++;
    });

    logger.compiler("\n  Reading css files: 0/" + len);

    for (i; i < len; i++) {
        splits = scripts[i].split(".");
        ext = splits[splits.length - 1];
        contents = yield fs.readFile(scripts[i], 'utf8');

        splits = scripts[i].replace(/\\/g, "/").split("/");
        name = splits[splits.length - 1].split(".")[0];
        compScripts[name] = { ext: ext, contents: contents };

        logger.clearCompiler("  Reading css files: " + (i + 1) + "/" + len);
    }

    yield thoughtpad.notify("css-precompile-request", {});
},

compileRequest = function *(thoughtpad, compScripts) {
    var script,
        i = 1,
        totalScripts = Object.keys(compScripts).length;

    // Save all the compied js files to an object
    thoughtpad.subscribe("css-compile-complete", function *(res) {
        compScripts[res.name] = res.contents;
    });

    thoughtpad.subscribe("css-compile-request", function *(res) {
        if (res.ext === "css") {
            compScripts[res.name] = res.contents;
        }
    });

    logger.clearCompiler("  Compiling css files: 0/" + totalScripts);

    for (script in compScripts) {
        yield thoughtpad.notify("css-compile-request", { ext: compScripts[script].ext, contents: compScripts[script].contents, name: script });
        logger.clearCompiler("  Compiling css files: " + i + "/" + totalScripts);
        i++;
    }
},

postCompileRequest = function *(thoughtpad, compScripts) {
    var script,
        i = 1,
        totalScripts = Object.keys(compScripts).length;

    thoughtpad.subscribe("css-postcompile-complete", function *(res) {
        compScripts[res.name].contents = res.contents;
    });

    // Perform any post compilation functions on the compiled contents
    for (script in compScripts) {
        logger.clearCompiler("  Performing post-compilation tasks on css files: " + i + "/" + totalScripts);
        yield thoughtpad.notify("css-postcompile-request", { contents: compScripts[script], name: script });
        i++;
    }
},

preOutputRequest = function *(thoughtpad, compScripts) {
    var bundle,
        i = 1,
        totalScripts = Object.keys(compScripts).length;

    thoughtpad.subscribe("css-preoutput-complete", function *(res) {
        logger.clearCompiler("  Performing pre-out tasks on css files: " + i + "/" + totalScripts);
        for (bundle in compScripts) {
            delete compScripts[bundle];
        }
        for (bundle in res.bundles) {
            compScripts[bundle] = res.bundles[bundle];
        }
        i++;
    });

    // Perform any preout functions
    yield thoughtpad.notify("css-preoutput-request", { contents: compScripts });
},

compile = function *(thoughtpad) {
    var i = 0,
        compScripts = {},
        script,
        totalScripts;

    yield preCompileRequest(thoughtpad, compScripts);
    yield compileRequest(thoughtpad, compScripts);
    yield postCompileRequest(thoughtpad, compScripts);
    yield preOutputRequest(thoughtpad, compScripts);

    // Finally output the files
    totalScripts = Object.keys(compScripts).length;
    i = 1;

    for (script in compScripts) {
        logger.clearCompiler("  Writing css files to directory: " + i + "/" + totalScripts);
        yield fileWriter.writeFile(thoughtpad.folders.preoutStylesheets + script + ".css", compScripts[script], "pre_out/");
        i++;
    }

    logger.info(" Done!");
}

module.exports = {
    compile: compile
}
