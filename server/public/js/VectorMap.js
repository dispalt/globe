/*-----------------------------------------------------------------------------

  Vector Map

------------------------------------------------------------------------------*/

function MagMap()
{
  this.map = {}
  this.incr = 2;
}

MagMap.prototype.increment = function(x1, y1, x2, y2)
{
  var key = [x1, y1, x2, y2].join(', ')

  if (this.map[key] === undefined) {
    this.map[key] = 0;
  }

  this.map[key] += this.incr;

  return this.map[key];
}

MagMap.prototype.decrement = function(x1, y1, x2, y2)
{
  var key = [x1, y1, x2, y2].join(', ')

  if (this.map[key] === undefined) {
    this.map[key] = 0;
  }

  this.map[key] -= this.incr;

  return this.map[key];
}

function VectorMap()
{
  var paper, mapSet, map, mapHeight, mapWidth,
  scaleX, scaleY, translateX, translateY,
  cache, dots, overlay, tip, queue, lineParam, queueIndex, interval, lineCheck;
  // var PROJECTION = 1; //0 - normal, 1 - robinson projection, 2 - equal area projection
  var PROJECTION = 1;
  var counter = 0;

  this.mag = new MagMap();

  this.init = function(nid)
  {
    paper = Raphael(nid);
    setTimeout(drawMap, 500);
    mapHeight = 550;
    mapWidth = 338;
    scaleX = 1.6;
    scaleY = 1.2;
    translateX = 200;
    translateY = 50;
    cache = {};
    dots = {};
  };
  drawMap = function()
  {
    var params =
    {
      fill: '#232323',
      'stroke-width': 0,
      translation: translateX.toString() + ',' + translateY.toString(),
      scale: scaleX.toString() + ',' + scaleY.toString()
    };

    switch (PROJECTION)
    {
      case 0 : map = paper.path(mapVector).attr(params); break;
      case 1 : map = paper.image('assets/map10.png', 0, 0, 960, 520); break;
      case 2 : map = paper.image('assets/map9.png', 0, 0, 960, 520); break;
    }
    map.attr({opacity: 0}).animate({opacity: 1}, 500);
    map.toBack();
  };

  latLngToPx = function(lat, lng)
  {
    switch (PROJECTION)
    {
      case 0: return latLngToPxNormal(lat, lng);
      case 1: return latLngToPxRobinson(lat, lng);
      case 2: return latLngToPxEA(lat, lng);
    }
  }

  // for equal-area projection
  latLngToPxEA = function(lat, lng)
  {
    const R = 6371.228, C = 36.5, r0 = 691, s0 = 292.5, rad = Math.PI / 180, aa = 30;
    var r = r0 + R / C * (lng * rad) * Math.cos(aa * rad);
    var s = s0 + R / C * Math.sin(lat * rad) / Math.cos(aa * rad);
    r = r * 1.0 - 205;
    s = -s * 1.406 * 0.75 + 545;

    return {
      x: r,
      y: s
    };
  };

  // for Robinson projection
  latLngToPxRobinson = function(lat, lng)
  {
    var poly = function(array, offset, z) {
        return (array[offset] + z * (array[offset + 1] + z * (array[offset + 2] + z * array[offset + 3])));
    }

    function degToRad(v) {
        return v * Math.PI / 180.0;
    }

    function radToDeg(v) {
        return v * 180.0 / Math.PI;
    }

    const X = [
    1, -5.67239e-12, -7.15511e-05, 3.11028e-06,
    0.9986, -0.000482241, -2.4897e-05, -1.33094e-06,
    0.9954, -0.000831031, -4.4861e-05, -9.86588e-07,
    0.99, -0.00135363, -5.96598e-05, 3.67749e-06,
    0.9822, -0.00167442, -4.4975e-06, -5.72394e-06,
    0.973, -0.00214869, -9.03565e-05, 1.88767e-08,
    0.96, -0.00305084, -9.00732e-05, 1.64869e-06,
    0.9427, -0.00382792, -6.53428e-05, -2.61493e-06,
    0.9216, -0.00467747, -0.000104566, 4.8122e-06,
    0.8962, -0.00536222, -3.23834e-05, -5.43445e-06,
    0.8679, -0.00609364, -0.0001139, 3.32521e-06,
    0.835, -0.00698325, -6.40219e-05, 9.34582e-07,
    0.7986, -0.00755337, -5.00038e-05, 9.35532e-07,
    0.7597, -0.00798325, -3.59716e-05, -2.27604e-06,
    0.7186, -0.00851366, -7.0112e-05, -8.63072e-06,
    0.6732, -0.00986209, -0.000199572, 1.91978e-05,
    0.6213, -0.010418, 8.83948e-05, 6.24031e-06,
    0.5722, -0.00906601, 0.000181999, 6.24033e-06,
    0.5322, 0., 0., 0.
    ];

    const Y = [
    0, 0.0124, 3.72529e-10, 1.15484e-09,
    0.062, 0.0124001, 1.76951e-08, -5.92321e-09,
    0.124, 0.0123998, -7.09668e-08, 2.25753e-08,
    0.186, 0.0124008, 2.66917e-07, -8.44523e-08,
    0.248, 0.0123971, -9.99682e-07, 3.15569e-07,
    0.31, 0.0124108, 3.73349e-06, -1.1779e-06,
    0.372, 0.0123598, -1.3935e-05, 4.39588e-06,
    0.434, 0.0125501, 5.20034e-05, -1.00051e-05,
    0.4968, 0.0123198, -9.80735e-05, 9.22397e-06,
    0.5571, 0.0120308, 4.02857e-05, -5.2901e-06,
    0.6176, 0.0120369, -3.90662e-05, 7.36117e-07,
    0.6769, 0.0117015, -2.80246e-05, -8.54283e-07,
    0.7346, 0.0113572, -4.08389e-05, -5.18524e-07,
    0.7903, 0.0109099, -4.86169e-05, -1.0718e-06,
    0.8435, 0.0103433, -6.46934e-05, 5.36384e-09,
    0.8936, 0.00969679, -6.46129e-05, -8.54894e-06,
    0.9394, 0.00840949, -0.000192847, -4.21023e-06,
    0.9761, 0.00616525, -0.000256001, -4.21021e-06,
    1., 0., 0., 0
    ];

    var NODES = 18;
    var FXC = 0.8487;
    var FYC = 1.3523;
    var C1 = 11.45915590261646417544;
    var RC1 = 0.08726646259971647884;
    var ONEEPS = 1.000001;
    var EPS = 1e-8;


    var project = function(lplam, lpphi) {
        var x,
        y;

        var phi = Math.abs(lpphi);
        var i = Math.floor(phi * C1);
        if (i >= NODES)
        i = NODES - 1;
        phi = radToDeg(phi - RC1 * i);
        i *= 4;
        x = poly(X, i, phi) * FXC * lplam;
        y = poly(Y, i, phi) * FYC;
        if (lpphi < 0.0)
        y = -y;
        return [x, y];
    }
    const rad = Math.PI / 180;
    var p = project(lng * rad, lat * rad),
    r = p[0] * 212.5 + 437,
    s = -p[1] * 212.5 + 285;

    return {x: r, y: s};
  };


  // for normal projection
  latLngToPxNormal = function(lat, lng)
  {
    lng = parseFloat(lng);
    lat = parseFloat(lat);
    var mapOffsetX, mapOffsetY;

    var x = (mapWidth * (180 + lng) / 360) % mapWidth;

    lat = lat * Math.PI / 180;
    var y = Math.log(Math.tan((lat / 2) + (Math.PI / 4)));
    y = (mapHeight / 2) - (mapWidth * y / (2 * Math.PI));

    if (!mapOffsetX)
    {
      mapOffsetX = mapWidth * 0.026;
    }
    if (!mapOffsetY)
    {
      mapOffsetY = mapHeight * 0.15;
    }
    return {
      x: (x * scaleX - mapOffsetX * scaleX) * 1.638 + translateX - 170,
      y: (y * scaleY - mapOffsetY * scaleY) * 1.638 + translateY - 108,
      xRaw: x,
      yRaw: y
    };
  };


  this.addPoint = function(color, lat, lng, key)
  {
    if (!lat.toFixed || !lng.toFixed) return;

    //if (cache[ip])
    //  return;

    if (dots[key]) return;

    if (!dots[key]) dots[key] = {};

    var conv = latLngToPx(lat, lng);
    var params =
    {
      fill: color,
      opacity: 0,
      stroke: color,
      'stroke-opacity': 0,
      'stroke-width': 4,
      translation: (conv.x).toString() + ',' + (conv.y).toString()
    },
    point = paper.circle(0, 0, 6).attr(params);

    setTimeout(function()
    {
      point.animate({opacity: 0.95, 'stroke-opacity': 0.3}, 600);
    }, Math.random() * 1000 + 1000);


    point.mouseout(function()
    {
      point.animate({scale: 1}, 300);
      onMouseOut();
    });

    point.mouseover(function()
    {
      point.animate({scale: 2}, 300);
      onMouseHover(key);
    });

    point.click(function()
    {
      // onMapClick(key);
    });

    dots[key] = point;
    counter++;

    return point;
  };

  this.addDataCenter = function(name, lat, lng) {
    //#7be0f3
    this.addPoint('#FFFFFF', lat, lng, name);
  };

  onMouseHover = function(key)
  {
    onMouseOut();
    if (!overlay) overlay = paper.set();
    var current = dots[key];

    const cx = current.attrs.cx;
    const cy = current.attrs.cy;
    showTip(key, '#00ff99', cx, cy);
  };

  onLineQueue = function()
  {
    if (queueIndex >= queue.length) return;

    var lineStr = queue[queueIndex];
    var line = paper.path(lineStr).attr(lineParam).animate({opacity: 0.5}, 100);
    overlay.push(line);
    // tip.toFront();
    queueIndex++;

    setTimeout(onLineQueue, interval);
    //overlay.push(line);
  };

  onMouseOut = function()
  {
    hideTip();
  };

  showTip = function(name, color, _x, _y)
  {
    if (!tip) tip = paper.set();
    const W = 75, H = 35;
    var x = _x - W / 2;
    var y = _y - H - 10;

    var rectParam =
    {
      fill: 'rgba(0,0,0,0.75)',
      'stroke-width': 0,
      opacity: 0.5
    };

    var rect = paper.rect(0, 0, W, H, 10).attr(rectParam);
    tip.push(rect);

    var circParams =
    {
      'stroke-width': 7,
      stroke: color,
      'stroke-opacity': 0.5,
      fill: color
    };

    var icon = paper.circle(H / 2, H / 2, 4).attr(circParams);
    tip.push(icon);

    var textParam =
    {
      'font-family': 'Lucida Grande',
      'font-size': 10,
      'text-anchor': 'start',
      fill: '#fff'
    };

    var text = paper.text(H, H / 2 - 1, name).attr(textParam);
    tip.push(text);

    //console.log(x)
    var tw = 960 - W;
    x = (x < 0 ? 16 : (x > tw ? tw - 16 : x));
    y = y < 0 ? y + 35 * 2 - 16 : y;
    // console.log(y)
    tip.attr({opacity: 0, translation: x + ' ' + y}).animate({opacity: 1}, 500);
  };

  hideTip = function()
  {
    if (!tip || tip.length == 0) return;
    for (var i = 0; i < tip.length; i++)
    {
      var item = tip.items[i];
      tip.remove();
    }
  };

  raiseDataCenters = function()
  {
    for (o in dots) {
      dots[o].toFront();
    }
  };

  this.removePoint = function(key)
  {
    if (dots[key])
    {
      var point = dots[key];
      point.animate({opacity: 0}, 500, '>', point.remove);
      delete dots[key];
    }
  };

  function highlightDot(point, color)
  {
    var x = point.attrs.cx;
    var y = point.attrs.cy;

    var params =
    {
      'stroke-width': 2,
      stroke: color,
      'stroke-opacity': 0.7
    };

    var circle = paper.circle(x, y, 4).attr(params);
    circle.animate({scale: 15, 'stroke-opacity': 0}, 500, 'linear', function() {circle.remove()});
  };

  this.addTarget = function(target) {
    var self = this;
    var ctColorMap = {
      'remote.http': '#FFFF00',
      'remote.ssh': '#FF99FF',
      'remote.ping': '#6600FF',
      'remote.tcp': '#CC00CC',
    }
    var color = ctColorMap[target.checkType];

    if (!color) {
      color = '#006666';
    }

    var conv = latLngToPx(target.geo.ll[0], target.geo.ll[1]);
    var dcconv = latLngToPx(target.datacenter.ll[0], target.datacenter.ll[1]);
    var lineStr;
    var mStr;
    var circleColor = color;

    if (String.fromCharCode(target.availability) != 'A') {
      /* make unavailable checks red */
      circleColor = '#FF0000';
    }
    else {
      circleColor = '#00FF00';
    }
    var params =
    {
      fill: circleColor,
      opacity: 0,
      stroke: color,
      'stroke-opacity': 0,
      'stroke-width': 5,
      translation: (conv.x).toString() + ',' + (conv.y).toString()
    };

    /**
    * We are building a single contorl point for the curve.
    * 
    */
    var curx = 
    Math.max(conv.x, dcconv.x) - Math.min(conv.x, dcconv.x);
    var cury = Math.max(conv.y, dcconv.y) - Math.min(conv.y, dcconv.y);

    function toCurve(x1, y1, x2, y2, magnitude) {
      var zx, zy;
      zx = x1 + magnitude;
      zy = x1;
      var path = [["M", x1, y1], ["C", x1, y1, x2, y2, zx, zy]];

      if (Math.floor(Math.random()*2) === 1) {
        magnitude = magnitude * -1;
      }
      path = [['M', x1, y1], ['C', x1 - magnitude, y1 - magnitude, x2 - magnitude, y2 - magnitude, x2, y2]];
      return path;
    }

    lineStr = 'M' + (dcconv.x).toString() + ',' + (dcconv.y).toString() +
              ' S' + (curx).toString() + ',' + (cury).toString() +
              ' ' + (conv.x).toString() + ',' + (conv.y).toString();

    lineStr = toCurve(dcconv.x, dcconv.y, conv.x, conv.y, this.mag.increment(dcconv.x, dcconv.y, conv.x, conv.y));

    mStr = 'M' + (dcconv.x).toString() + ',' + (dcconv.y).toString();

    console.log(mStr);
    console.log(lineStr);

    var point = paper.circle(0, 0, 3).attr(params);

    var line = paper.path(mStr).attr({
      fill: 'none',
      opacity: 0,
      stroke: color,
      'stroke-opacity': 0,
      'stroke-width': 2,
    });

    setTimeout(function()
    {
      point.animate({opacity: 0.5, 'stroke-opacity': 0.1}, 600);
      line.animate({path: lineStr, opacity: 0.5, 'stroke-opacity': 0.9}, 2000);
      raiseDataCenters();
    }, Math.random() * 3000);

    setTimeout(function()
    {
      point.animate({opacity: 0}, 750, '>', point.remove);
      line.animate({opacity: 0}, 750, '>', line.remove);
      raiseDataCenters();
      self.mag.decrement(dcconv.x, dcconv.y, conv.x, conv.y)
    }, Math.random() * 3000 + 10000);

    raiseDataCenters();
  };
}
