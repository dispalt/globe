if(System.support.webgl === false){

  var message = document.createElement( 'div' );
  message.style.cssText = 'font-family:monospace;font-size:13px;text-align:center;color:#fff;background:#333;padding:1em;width:540px;margin:30em auto 0';
  message.innerHTML = 'Either your graphics card or your browser does not support WebGL.<br /><a href="http://www.khronos.org/webgl/wiki_1_15/index.php/Getting_a_WebGL_Implementation">View a list</a> of WebGL compatible browsers.';
  document.body.appendChild( message );
  document.body.style.background = '#000000';

} else {

  var years = ['1990','1995','2000'];
  var container = document.getElementById('container');
  var globe = new DAT.Globe(container);
  var linesData = [[6, 159], [0.001, 30]];

  var settime = function(globe, t) {
    return function() {
      new TWEEN.Tween(globe).to({time: t/years.length},500).easing(TWEEN.Easing.Cubic.Out).start();
      var y = document.getElementById('year'+years[t]);
      if (y.getAttribute('class') === 'year active') {
        return;
      }
      var yy = document.getElementsByClassName('year');
      for(var i=0; i<yy.length; i++) {
        yy[i].setAttribute('class','year');
      }
      y.setAttribute('class', 'year active');
    };
  };

  for(var i = 0; i<years.length; i++) {
    var y = document.getElementById('year'+years[i]);
    y.addEventListener('mouseover', settime(globe,i), false);
  }

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
    }, 1000);
    globe.animate();
  }, false);
  xhr.open('GET', 'data/population909500.json', true);
  xhr.send(null);

  var animate = function(){
    requestAnimationFrame(animate);
    TWEEN.update();
  }

  animate();

}
