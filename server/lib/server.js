var express = require('express');
var sockjs = require('sockjs');
var optimist = require('optimist');
var path = require('path');
var scribe = require('./scribe_server');
var EventEmitter = require('events').EventEmitter;

exports.run = function() {
  var sjs,
      argv,
      server,
      pubRoot,
      indexPath,
      ee;

  optimist = optimist.usage('Usage: $0 -p [port] -h [hostname] -s [scribe-port] --help');
  optimist = optimist['default']('s', 8095);
  optimist = optimist['default']('p', 8080);
  optimist = optimist['default']('h', '0.0.0.0');

  argv = optimist.argv;

  if (argv.help) {
    util.puts('maasworld:\n' +
              '  -p [port] Port to bind HTTP server to.\n' +
              '  -h [host] Host to bind HTTP server to.\n' +
              '  -s [port] Port to bind Scribe server to.\n');
        process.exit();
    return;
  }

  ee = new EventEmitter();

  sjs = sockjs.createServer();
  sjs.on('connection', function(conn) {
    ee.on('target', function(msg) {
      conn.write(JSON.stringify(msg));
    });
    conn.on('close', function() {});
  });


  pubRoot = path.join(__dirname, '../public');
  indexPath = path.join(pubRoot, 'index.html');

  app = express.createServer();
  app.use(express.logger());
  sjs.installHandlers(app, {prefix: '/targets'});
  app.use(express['static'](pubRoot));
  app.get('/', express['static'](indexPath));
  app.listen(argv.p, argv.h);
  scribe.run(ee, argv.s, '0.0.0.0')
};

