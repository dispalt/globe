
var datacenters = [
  {name: 'ORD1', mzname: 'mzord', ll: [41.994369, -87.962647], mag: 0},
  {name: 'DFW1', mzname: 'mzdfw', ll: [32.932831, -97.10419], mag: 0},
  {name: 'IAD2', mzname: 'mziad', ll: [39.018167, -77.462917], mag: 0},
  {name: 'LON3', mzname: 'mzlon', ll: [51.523539, -0.634012], mag: 0},
  {name: 'HKG1', mzname: 'mzhkg', ll: [22.398013, 114.19037], mag: 0}
];

window.onload = function() {
  var DCMAP = {};
	map = new VectorMap();
	map.init('map');

  datacenters.forEach(function(dc) {
    map.addDataCenter(dc.name, dc.ll[0], dc.ll[1]);
    DCMAP[dc.mzname] = dc;
  });

  function setupSockJS() {
    var sock = new SockJS('/targets');
    sock.onopen = function() {
      console.log('open');
    };

    sock.onmessage = function(e) {
      var info  = JSON.parse(e.data);
      info.datacenter = DCMAP[info.monitoringZone];
      //console.log('message', info);
      map.addTarget(info);
    };

    sock.onclose = function() {
      console.log('close');
      setTimeout(function() {
        setupSockJS();
      }, 500);
    };
  }

  setTimeout(function() {
    setupSockJS();
  }, 1);

/*
  setTimeout(function() {
    map.removePoint('ORD1');
  }, 6000);
*/

};
