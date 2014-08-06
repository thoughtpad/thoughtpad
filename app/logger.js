var clc = require('cli-color');

module.exports = {
    info: function (text) {
        process.stdout.write(clc.greenBright(text));
    },
    compiler: function (text) {
        process.stdout.write(clc.yellowBright(text));
    },
    clearCompiler: function (text) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(clc.yellowBright(text));
    },
    error: function (text) {
        process.stdout.write(clc.redBright(text));
    },
    general: function (text) {
        process.stdout.write(clc.white(text));
    }
};