var thrift = require('thrift');
var Buffer = require('buffer').Buffer;
var TMemoryBuffer = thrift.transport.TMemoryBuffer;
var TBinaryProtocol = thrift.protocol.TBinaryProtocol;

var Telescope = require('../generated/gen-nodejs/telescope_types').Telescope;
var TelescopeOrRemove = require('../generated/gen-nodejs/telescope_types').TelescopeOrRemove;
var scribe = require('../generated/gen-nodejs/scribe');
var ResultCode = require('../generated/gen-nodejs/scribe_types').ResultCode;
var util = require('util');
var dns = require('dns');
var gi = require('geoip-lite');

var listOfTelescopes = [];
var DESIRED_RATE = 100;


function resetList() {
  listOfTelescopes = [];
}

function processMsg(msg) {
  var input, obj, target, te, geo = null;

  input = new TBinaryProtocol(new TMemoryBuffer(new Buffer(msg.message, 'base64')));
  obj = new TelescopeOrRemove();
  obj.read(input);

  te = obj.telescope;

  dns.lookup(te.target, 4, function(err, address) {
    if (err) {
      console.error(err);
      return;
    }
    try {
      geo = gi.lookup(address);
    }
    catch(e) {
      console.error(te.monitoringZoneId + ' -> ' + te.target, address, geo);
      util.puts(util.inspect(obj, false, 8));
      console.error(e);
      // process.exit();
    }
    if (geo) {
      var result = {
        checkType: te.checkType,
        status: te.status,
        availability: te.availability,
        geo: geo
      };
      listOfTelescopes.push(result);
    }
  });
}

exports.run = function(emitter, port, host) {
  resetList();

  setInterval(function() {
    var list = listOfTelescopes;
    console.log("Serving " + list.length);
    resetList();
  }, 1000);

  var server = thrift.createServer(scribe, {
    Log: function(entries, success) {
      // suck it in baby
      try {
        success(ResultCode.OK);
      } catch (e1) {
        log.warn('scribe response error', {err: e1});
      }
      entries.forEach(processMsg);
      return;
    }
  });

  server.listen(port, host);
};
