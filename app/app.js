var koa = require('koa'),
    router = require('koa-router'),
    logger = require('koa-logger'),
    app,
    compiler = require('./compiler/compiler'),
    applogger = require('./logger'),
    routes = require('./routes'),
    cluster = require('cluster'),
    config = require('./config'),
    fs = require('co-fs'),
    mode = config.mode,
    numCPUs = require('os').cpus().length,
    serve,
    worker,
    co = require('co'),
    getRealDirName = function *() {
        var realDirName = yield fs.realpath(__dirname + "/../out/");
        serve = require('koa-file-server')(realDirName, {
            index: true
        });
    },
    startListenServer = function *() {
        yield getRealDirName();

        app = module.exports = koa();
        app.use(logger());
        app.use(serve);
        app.use(router(app));
        routes.registerRoutes(app);

        // Listen if the mocha test suite isn't importing the app
        app.listen(config[mode].port);
    };

if (cluster.isMaster && !module.parent) {
    // Fork workers - one for each CPU
    applogger.info('\nCreating ' + (numCPUs - 1) + ' server workers');
    for (var i = 0; i < numCPUs; i++) {
        worker = cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        if (signal !== "SIGUSR2") { // the nodemon restart signal
            applogger.error('\nWorker ' + worker.process.pid + ' has died. Adding new worker');
            cluster.fork();
        }
    });

    applogger.info("\nListening on port " + config[mode].port);

    // Once we've clustered the server, we can (re)compile all the hosted sites
    co(function *() {
        yield getRealDirName();

        yield compiler.compile(serve.cache);
    })();


} else {
    co(function *() {
        yield startListenServer();
    })();
}
