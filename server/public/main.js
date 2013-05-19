if(System.support.webgl === false){

  var message = document.createElement( 'div' );
  message.style.cssText = 'font-family:monospace;font-size:13px;text-align:center;color:#fff;background:#333;padding:1em;width:540px;margin:30em auto 0';
  message.innerHTML = 'Either your graphics card or your browser does not support WebGL.<br /><a href="http://www.khronos.org/webgl/wiki_1_15/index.php/Getting_a_WebGL_Implementation">View a list</a> of WebGL compatible browsers.';
  document.body.appendChild( message );
  document.body.style.background = '#000000';

} else {

  function colorChooser(checkType) {
    var c = new THREE.Color();
    c.setHSL( 1.0, 1.0, 1.0 );
    if (checkType === 'remote.ping') {
      return c;
    }
    if (checkType === 'remote.http') {
      return c;
    }
    return c;
  }

  var container = document.getElementById('container');
  var globe = new DAT.Globe(container, colorChooser);
  var datacenters = {
    mzord: {name: 'ORD1', mzname: 'mzord', ll: [41.994369, -87.962647], mag: 0},
    mzdfw: {name: 'DFW1', mzname: 'mzdfw', ll: [32.932831, -97.10419], mag: 0},
    mziad: {name: 'IAD2', mzname: 'mziad', ll: [39.018167, -77.462917], mag: 0},
    mzlon: {name: 'LON3', mzname: 'mzlon', ll: [51.523539, -0.634012], mag: 0},
    mzhkg: {name: 'HKG1', mzname: 'mzhkg', ll: [22.398013, 114.19037], mag: 0}
  };


  /*
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function(e) {
    var data = JSON.parse(e.target.responseText);
    window.data = data;
    //for (var i=0;i<data.length;i++) {
    //  globe.addData(data[i][1], {format: 'magnitude', name: data[i][0], animated: true});
    //}
    var set = data[0][1], i =0;
    //globe.createPoints();
    //settime(globe,0)();
    setInterval(function() {
      globe.addLines(set);
      set = set.slice(5);
      i++;
    }, 25);
    globe.animate();
  }, false);
  xhr.open('GET', 'data/population909500.json', true);
  xhr.send(null);
  */

  function setupSockJS() {
    var sock = new SockJS('/targets');
    sock.onopen = function() {
      globe.animate();
      console.log('open');
    };

    sock.onmessage = function(e) {
      var info  = JSON.parse(e.data);
      //console.log('message', info);
      if (info.type === 'result') {
        var dcLL = datacenters[info.data.monitoringZoneId] && datacenters[info.data.monitoringZoneId].ll;
        var tuple = [dcLL[0], dcLL[1], info.data.geo.ll[0], info.data.geo.ll[1], info.data.checkType];
        //console.log(tuple);
        globe.addLines(tuple);
        //globe.addData(dcLL.concat(200), {});
        //globe.addData(info.data.geo.ll.concat(200), {});
        //globe.createPoints();
      }
    };

    sock.onclose = function() {
      console.log('close');
      setTimeout(function() {
        setupSockJS();
      }, 500);
    };
  }

  var animate = function(){
    requestAnimationFrame(animate);
    TWEEN.update();
  };

  animate();
  setupSockJS();

}
