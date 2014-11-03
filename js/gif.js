/*
* Youtube stuff
*/
//'use strict';
var vidLength = 0;
var ready = false;
var slider;

/*
* generic time helpers
*/
function secsToHHMMSS(seconds) {
  // http://stackoverflow.com/a/1322830
  var hours = parseInt( seconds / 3600 ) % 24,
      minutes = parseInt( seconds / 60 ) % 60,
      seconds = seconds % 60;

  var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
  return result;
}

function HHMMSSToSecs(hhmmss) {
  stuff = hhmmss.split(":");
  var hours = parseInt( stuff[0] * 3600 ),
      minutes = parseInt( stuff[1] * 60 ),
      seconds = parseInt(stuff[2]);

  return hours+minutes+seconds;
}

/*
* youtube specific methods
*/
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
    slider = new DoubleSlider('slider_horizontal', {
      onChange: function (firstValue, secondValue) {
        ytplayer = document.getElementById('myytplayer');
        var first = $('#firstValueH'),
            second = $('#secondValueH');
        if (ready && first.val() !== firstValue) {
          ytplayer.seekTo(firstValue, true);
        }
        first.val(secsToHHMMSS(firstValue)).data("secs", firstValue);
        second.val(secsToHHMMSS(secondValue)).data("secs", secondValue);
      },
      range: [0, vidLength],
      start: [0, vidLength],
      precision: 0
    });
  }
}

/*
* gif methods
*/
function createGif(data) {
  var oldanswer = '',
    ansdiv = $('#answer'),
    resp = ansdiv.find('#resp').empty(),
    button = $('#gfybutton').empty(),
    gfycat = $('#gfycat').empty();

  var endpoint = '97.107.141.47:8080/',
    giflink = endpoint + 'gifs/' + data.id,
    joblink = endpoint + 'jobs/' + data.id;

  // check the jobs url until the status is active
  var interval = setInterval(function () {
    $.get(
      'http://' + joblink,
      function (d) {
        if (d.status === 'available') {
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
                    fakespin = setInterval(function(){
                      gfycat.append(".");
                    }, 200);
                    // where we hit up the gfy api
                    $.get('http://upload.gfycat.com/transcode?fetchUrl=' + giflink,
                      // and respond by adding a label/link combo to the page
                      function (gcat) {
                        clearInterval(fakespin);
                        gfycat.empty();
                        gfycat.append(
                          $('<a/>', {
                            'href': 'http://gfycat.com/' + gcat.gfyName,
                            text: 'http://gfycat.com/' + gcat.gfyName
                          })
                        );
                      }
                    );
                  }
                }
              }
            )
          );
          $('#gifit').prop("disabled", false);
          return;
        }
        if (d.status === 'failed') {
          console.log(d);
          clearInterval(interval);
          resp.text(String(d.status) + ": " + String(d.description));
          $('#gifit').prop("disabled", false);
          return;
        }
        if (oldanswer !== d.status) {
          resp.text(String(d.status));
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
    'dur': dur,
    'vw': $('#myytplayer').width(),
    'vh': $('#myytplayer').height()
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
      $('#gifit').prop("disabled", false);
    }
  );
}

function updateCoords(c) {
  $('#x').val(c.x);
  $('#y').val(c.y);
  $('#w').val(c.w);
  $('#h').val(c.h);
}

// cropIt helps set the z-index for the jcrop div and toggles cropping
function cropit() {
   /*jshint validthis:true */
  var _this = this,
    el = $('#holder'),
    ytplayer = document.getElementById('myytplayer');

  /*jshint validthis:true */
  // flipping on cropping
  if (!this.jcropEl) {
    // set the holder div to the player size
    el.width(ytplayer.width);
    el.height(ytplayer.height);
    // set up jcrop
    el.Jcrop(
      {
        onSelect: updateCoords
      }, function () {
        // jcropElement and _this.jcropElement are all equal to holder's parent,
        // which is now jcrop-holder, because jcrop changes everything
        var jcropEl = _this.jcropEl = el.parent();
        _this.jcropping = true;
        // set the whole row to transparent + abs
        jcropEl.css({
          'background-color': 'transparent',
          position: 'absolute'
        });
      }
    );
    $('#cropit').val('stop it');
  } else if (!this.jcropping) {
    // if we pressed the button and we're not cropping, start to crop
    // do this by sending the jcrop div to the front
    this.jcropEl.css({
      'z-index': 600
    });
    this.jcropping = true;
    $('#cropit').val('stop it');
  } else {
    // otherwise we're cropping, and we want it off, send jcrop to the background
    this.jcropEl.css({
      'z-index': -10
    });
    this.jcropping = false;
    $('#cropit').val('crop it?');
  }
}

// jcrop.destroy kills too many divs, jcrop in general modifies a lot
// just set things back to how they used to be
function killCrop() {
  if ($('.jcrop-holder')) {
    $('.jcrop-holder').replaceWith($('<div/>', {
      'id': 'holder'
    }));
  }
  this.jcropEl = null;
  this.jcropping = false;
  $('#holder').after('<div id="ytapiplayer"></div>');
}

function makeSWF(id) {
  var params = { allowScriptAccess: 'always' },
    atts = { id: 'myytplayer' },
    width = 480,
    height = 360;

  if (isWidescreen(id)) {
    height = 270;
    console.log("is widescreen");
  }

  swfobject.embedSWF(
    'http://www.youtube.com/v/' +
      id +
      '?enablejsapi=1&playerapiid=ytplayer&version=3&fs=0&iv_load_policy=3&showinfo=0&rel=0',
    'ytapiplayer',
    width,
    height,
    '8',
    null,
    null,
    params,
    atts
  );
}

function isWidescreen(id) {
  var v2url = 'http://gdata.youtube.com/feeds/api/videos/' + id + '?v=2&alt=jsonc';
  bits = $.parseJSON($.ajax({
      type: 'GET',
      url: v2url,
      dataType: 'json',
      success: function() { },
      data: {},
      async: false
  }).responseText);

  if (bits.data.aspectRatio !== undefined) {
    return true;
  } else {
    return false;
  }
}

function init() {
  // default video to display
  makeSWF('7QLSRMoKKS0');
  // actually sends the request
  $('#gifit').on(
    'click', function () {
      $(this).prop("disabled", true);
      gifit($('#firstValueH').data("secs"), $('#secondValueH').data("secs") - $('#firstValueH').data("secs"));
    }
  );
  // toggles cropping
  $('#cropit').on(
    'click', function () {
      cropit();
    }
  );
  // validates the URL param and updates the swfobject
  $('#url').on('input', function () {
    var input = $(this),
        re = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_\-]{11})$/;
    var isLegit = re.exec(input.val());

    if (isLegit) {
      $('span', input.parent()).removeClass('error_show').addClass('error');
      // replace the current swf with the next one
      swfobject.removeSWF('myytplayer');
      killCrop();
      vidLength = 0;
      makeSWF(isLegit[1]);
    } else {
      $('span', input.parent()).removeClass('error').addClass('error_show');
    }
  });
  // loop video between toggles
  setInterval(function() {
    ytplayer = document.getElementById('myytplayer');
    if (typeof ytplayer.getPlayerState !== 'function') {
      return;
    }
    if (ytplayer.getPlayerState() === -1) {
      return;
    }
    if (ytplayer.getCurrentTime() > $('#secondValueH').data("secs")) {
      ytplayer.seekTo($('#firstValueH').data("secs"), true);
    }
  }, 500);
  // update the slider time fields when changed
  $(':text').keyup( function() {
    elem = $(this);
    var time_re = /^\d{2}:\d{2}:\d{2}$/;
    real_time = time_re.exec(elem.val());
    if (!real_time) {
      return;
    }
    // update the secs data val
    elem.data("secs", HHMMSSToSecs(elem.val()));
    // update knobs
    slider.setKnobs($('#firstValueH').data('secs'), $('#secondValueH').data('secs'));
    // reseek since user probably wants a fresh view
    ytplayer.seekTo($('#firstValueH').data("secs"), true);
  });
}
