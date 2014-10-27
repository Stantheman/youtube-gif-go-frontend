/*
* Youtube stuff
*/
//'use strict';
var vidLength = 0;
var ready = false;

// function parameter are optional

function onYouTubePlayerReady() {
  var ytplayer = document.getElementById('myytplayer');
  ytplayer.addEventListener('onStateChange', 'ytStateChange');
  ytplayer.mute();
  ready = true;
}

function ytStateChange(change) {
  var ytplayer = document.getElementById('myytplayer');
  if ((vidLength === 0) && (change === -1)) {
    vidLength = ytplayer.getDuration();
    new DoubleSlider('slider_horizontal', {
      onChange: function (firstValue, secondValue) {
        ytplayer = document.getElementById('myytplayer');
        if (ready && document.id('firstValueH').value !== firstValue) {
          ytplayer.seekTo(firstValue, true);
        }
        document.id('firstValueH').set('value', firstValue);
        document.id('secondValueH').set('value', secondValue);
      },
      range: [0, vidLength],
      start: [0, vidLength],
      precision: 0
    });
  }
}

function createGif(data) {
  var oldanswer = '',
    ansdiv = $('#answer'),
    resp = ansdiv.find('#resp').empty(),
    button = ansdiv.find('#gfybutton').empty(),
    gfycat = ansdiv.find('#gfycat').empty(),
    giflink = '97.107.141.47:8080/gifs/' + data.id,
    // make synchronous
    interval = setInterval(function () {
      $.get(
        'http://' + giflink,
        function (d) {
          // workaround for dumb api response
          if (typeof d !== 'object') {
            clearInterval(interval);
            resp.empty()
            resp.append($('<img/>', {'src': 'http://' + giflink}));
            resp.append('<br/>');
            // make gfycat button
            button.empty()
            button.append(
              $('<button/>',
                {
                  'id': 'gfycat', 
                  'text': 'gimme gfycat',
                  // with onclick action
                  on: {
                    click: function () {
                      // where we hit up the gfy api
                      $.get('http://upload.gfycat.com/transcode?fetchUrl=' + giflink,
                        // and respond by adding a label/link combo to the page
                        function (gcat) {
                          gfycat.append([
                            $('<label/>', {'value': 'gfycat:'}),
                            $('<a/>', {
                              'href': 'http://gfycat.com/' + gcat.gfyName
                            })
                          ]);
                        }
                      );
                    }
                  }
                }
              )
            );
            return;
          }
          // it's real json
          if (d.hasOwnProperty('status') && (oldanswer !== d.status)) {
            resp.text(String(d.status));
            // this is bad too
            if (d.status.match('^failed at')) {
              clearInterval(interval);
            }
            oldanswer = d.status;
          } else {
            resp.text(resp.text() + '.');
          }
        }
      )}, 1000);
}

function gifit(start, dur) {
  var payload = {
    'url': $('#url').val(),
    'start': start,
    'dur': dur
  };
  if ($('#x').val() !== '' && $('#cropit').val() !== 'crop it?') {
    // extend
    $.extend(payload, {
      'cx': $('#x').val(),
      'cy': $('#y').val(),
      'ch': $('#h').val(),
      'cw': $('#w').val()
    });
  }
  $.post(
    'http://97.107.141.47:8080/gifs',
    payload,
    createGif
  )
    .fail(function(xhr, status, errorThrown) {
      console.log(xhr, status, errorThrown)
      $('#resp').text(String(errorThrown));
    }
  );
}

function updateCoords(c) {
  $('#x').val(c.x);
  $('#y').val(c.y);
  $('#w').val(c.w);
  $('#h').val(c.h);
}

function cropit() {
   /*jshint validthis:true */
  var _this = this,
    el = $('#holder'),
    ytplayer = document.getElementById('myytplayer');

  /*jshint validthis:true */
  if (!this.jcropEl) {
    el.width(ytplayer.width);
    el.height(ytplayer.height);
    el.Jcrop({
      onSelect: updateCoords
    }, function () {
      var jcropEl = _this.jcropEl = el.parent();
      _this.jcropping = true;
      jcropEl.css({
        'background-color': 'transparent',
        position: 'absolute'
      });
    });
    $('#cropit').val('stop it');
  } else if (!this.jcropping) {
    this.jcropEl.css({
      'z-index': 600
    });
    this.jcropping = true;
    $('#cropit').val('stop it');
  } else {
    this.jcropEl.css({
      'z-index': -10
    });
    this.jcropping = false;
    $('#cropit').val('crop it?');
  }
}

function makeSWF(id) {
  var params = { allowScriptAccess: 'always' },
    atts = { id: 'myytplayer' };
  swfobject.embedSWF(
    'http://www.youtube.com/v/' +
      id +
      '?enablejsapi=1&playerapiid=ytplayer&version=3&fs=0&iv_load_policy=3&showinfo=0&rel=0',
    'ytapiplayer',
    '480',
    '360',
    '8',
    null,
    null,
    params,
    atts
  );
}

function init() {
  // default video to display
  makeSWF('7QLSRMoKKS0');
  // actually sends the request
  document.getElementById('gifit').onclick = function () {
    gifit(document.id('firstValueH').value, document.id('secondValueH').value - document.id('firstValueH').value);
  };
  // toggles cropping
  document.getElementById('cropit').onclick = function () {cropit(); };
  // validates the URL param and updates the swfobject
  $('#url').on('input', function () {
    var input = $(this),
      re = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_\-]{11})$/;
    var isLegit = re.exec(input.val());
    if (isLegit) {
      $('span', input.parent()).removeClass('error_show').addClass('error');
      swfobject.removeSWF('myytplayer');
      vidLength = 0;
      $('#holder').after('<div id="ytapiplayer"></div>');
      makeSWF(isLegit[1]);
    } else {
      $('span', input.parent()).removeClass('error').addClass('error_show');
    }
  });

  // loop video between toggles
  setInterval(function() {
    ytplayer = document.getElementById('myytplayer');
    if (ytplayer.getCurrentTime() > $('#secondValueH').val()) {
      ytplayer.seekTo($('#firstValueH').val(), true);
    }
  }, 500);

}
