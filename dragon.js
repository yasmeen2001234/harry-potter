/* Cloud Animated by. Lorin Tackett - https://codepen.io/ltackett/details/tIHzp 
 
 Source 7 Dragons Code by. Rauri -
 https://codepen.io/raurir/full/KoJLH
 
 Source Audio Mp3 Code by. 
 Jereme Causing - https://codepen.io/jeremejazz/pen/yKwgx
 
 Design code is edited by. Myscript2010 -
 http://sample-mys2010.blogspot.co.id/2016/04/memasang-audio-mp3-with-7-dragons.html 
 <code>
 */
var a = document.getElementsByTagName("canvas")[0];
var b = document.body;
var d = (function (e) {
  return function () {
    e.parentNode.removeChild(e);
  };
})(a);
// unprefix some popular vendor prefixed things (but stick to their original name)
var AudioContext = window.AudioContext || window.webkitAudioContext;
var requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (f) {
    setTimeout(f, 1000 / 30);
  };
// stretch canvas to screen size (once, wont onresize!)
a.style.width = (a.width = innerWidth - 0) + "px";
a.style.height = (a.height = innerHeight - 0) + "px";
var c = a.getContext("2d");
// end shim
var sw = a.width,
  sh = a.height,
  M = Math,
  Mc = M.cos,
  Ms = M.sin,
  ran = M.random,
  pfloat = 0,
  pi = M.PI,
  dragons = [],
  shape = [],
  loop = function () {
    a.width = sw; // clear screen
    for (j = 0; j < 7; j++) {
      if (!dragons[j]) dragons[j] = dragon(j); // create dragons initially
      dragons[j]();
    }
    pfloat++;
    requestAnimationFrame(loop);
  },
  dragon = function (index) {
    var scale = 0.1 + (index * index) / 49,
      gx = (ran() * sw) / scale,
      gy = sh / scale,
      lim = 300, // this gets inlined, no good!
      speed = 3 + ran() * 5,
      direction = pi, //0, //ran() * pi * 2, //ran(0,TAU),
      direction1 = direction,
      spine = [];
    return function () {
      // check if dragon flies off screen
      if (
        gx < -lim ||
        gx > sw / scale + lim ||
        gy < -lim ||
        gy > sh / scale + lim
      ) {
        // flip them around
        var dx = sw / scale / 2 - gx,
          dy = sh / scale / 2 - gy;
        direction = direction1 = M.atan(dx / dy) + (dy < 0 ? pi : 0);
      } else {
        direction1 += ran() * 0.1 - 0.05;
        direction -= (direction - direction1) * 0.1;
      }
      // move the dragon forwards
      gx += Ms(direction) * speed;
      gy += Mc(direction) * speed;
      // calculate a spine - a chain of points
      // the first point in the array follows a floating position: gx,gy
      // the rest of the chain of points following each other in turn
      for (i = 0; i < 70; i++) {
        if (i) {
          if (!pfloat) spine[i] = { x: gx, y: gy };
          var p = spine[i - 1],
            dx = spine[i].x - p.x,
            dy = spine[i].y - p.y,
            d = M.sqrt(dx * dx + dy * dy),
            perpendicular = M.atan(dy / dx) + pi / 2 + (dx < 0 ? pi : 0);
          // make each point chase the previous, but never get too close
          if (d > 4) {
            var mod = 0.5;
          } else if (d > 2) {
            mod = (d - 2) / 4;
          } else {
            mod = 0;
          }
          spine[i].x -= dx * mod;
          spine[i].y -= dy * mod;
          // perpendicular is used to map the coordinates on to the spine
          spine[i].px = Mc(perpendicular);
          spine[i].py = Ms(perpendicular);
          if (i == 20) {
            // average point in the middle of the wings so the wings remain symmetrical
            var wingPerpendicular = perpendicular;
          }
        } else {
          // i is 0 - first point in spine
          spine[i] = { x: gx, y: gy, px: 0, py: 0 };
        }
      }
      // map the dragon to the spine
      // the x co-ordinates of each point of the dragon shape are honoured
      // the y co-ordinates of each point of the dragon are mapped to the spine
      c.moveTo(spine[0].x, spine[0].y);
      for (i = 0; i < 154; i += 2) {
        // shape.length * 2 - it's symmetrical, so draw up one side and back down the other
        if (i < 77) {
          // shape.length
          // draw the one half from nose to tail
          var index = i; // even index is x, odd (index + 1) is y of each coordinate
          var L = 1;
        } else {
          // draw the other half from tail back to nose
          index = 152 - i;
          L = -1;
        }
        var x = shape[index];
        var spineNode = spine[shape[index + 1]]; // get the equivalent spine position from the dragon shape
        if (index >= 56) {
          // draw tail
          var wobbleIndex = 56 - index; // table wobbles more towards the end
          var wobble = Ms(wobbleIndex / 3 + pfloat * 0.1) * wobbleIndex * L;
          x = 20 - index / 4 + wobble;
          // override the node for the correct tail position
          spineNode = spine[index * 2 - 83];
        } else if (index > 13) {
          // draw "flappy wings"
          // 4 is hinge point
          x =
            4 + (x - 4) * (Ms((((-x / 2 + pfloat) / 25) * speed) / 4) + 2) * 2; // feed x into sin to make wings "bend"
          // override the perpindicular lines for the wings
          spineNode.px = Mc(wingPerpendicular);
          spineNode.py = Ms(wingPerpendicular);
        }
        c.lineTo(
          (spineNode.x + x * L * spineNode.px) * scale,
          (spineNode.y + x * L * spineNode.py) * scale,
        );
      }
      c.fill();
    };
  };
// the shape of the dragon, converted from a SVG image
'! ((&(&*$($,&.)/-.0,4%3"7$;(@/EAA<?:<9;;88573729/7,6(8&;'
  .split("")
  .map(function (a, i) {
    shape[i] = a.charCodeAt(0) - 32;
  });
loop();

$(function () {
  $("video,audio").mediaelementplayer({
    success: function (mediaElement, domObject) {
      var audio_src = $("li.current").attr("data-url");
      mediaElement.setSrc(audio_src);
      mediaElement.addEventListener(
        "ended",
        function (e) {
          mys2010PlayNext(e.target);
        },
        false,
      );
    },
    keyActions: [],
  });

  $(".mys2010-list li").click(function () {
    $(this).addClass("current").siblings().removeClass("current");
    var audio_src = $(this).attr("data-url");
    $("audio#mys2010:first").each(function () {
      this.player.pause();
      this.player.setSrc(audio_src);
      this.player.play();
    });
  });
});
function mys2010PlayNext(currentPlayer) {
  if ($(".mys2010-list li.current").length > 0) {
    // get the .current song
    var current_item = $(".mys2010-list li.current:first"); // :first is added if we have few .current classes
    var audio_src = $(current_item).next().text();
    $(current_item)
      .next()
      .addClass("current")
      .siblings()
      .removeClass("current");
    console.log("if " + audio_src);
  } else {
    // if there is no .current class
    var current_item = $(".mys2010-list li:first"); // get :first if we don't have .current class
    var audio_src = $(current_item).next().text();
    $(current_item)
      .next()
      .addClass("current")
      .siblings()
      .removeClass("current");
    console.log("elseif " + audio_src);
  }

  if ($(current_item).is(":last-child")) {
    // if it is last - stop playing
    $(current_item).removeClass("current");
  } else {
    currentPlayer.setSrc(audio_src);
    currentPlayer.play();
  }
}
