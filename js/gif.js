/*
* Youtube stuff
*/
var vid_length = 0;
var ready = false;
function onYouTubePlayerReady(playerId) {
	console.log(playerId);
	ytplayer = document.getElementById("myytplayer");
	console.log(ytplayer)
	ytplayer.addEventListener("onStateChange", "ytStateChange");
	ytplayer.mute();
	ready = true;
}
function ytStateChange(change) {
	ytplayer = document.getElementById("myytplayer");
	console.log("change: " +change + ". vid_length: " + vid_length + ". state: " + change)
	if (vid_length == 0 && change == -1) {
		vid_length = ytplayer.getDuration()
		new DoubleSlider("slider_horizontal", {
			onStart: function(a, b){console.log('start');},
			onComplete: function(){console.log('complete');},
			onChange: function(firstValue, secondValue) {
				ytplayer = document.getElementById("myytplayer")
				if (ready && document.id('firstValueH').value != firstValue) {
					console.log("totally updating: first: " + firstValue + " current " + document.id('firstValueH').value )
					ytplayer.seekTo(firstValue, true);
				}
				document.id('firstValueH').set('value', firstValue);
				document.id('secondValueH').set('value', secondValue);
			},
			range: [0, vid_length],
			start: [0, vid_length],
			precision: 0,
		});
	}
}
function gifit(start, dur) {
	var payload = {
		"url":$('#url').val(),
		"start":start,
		"dur": dur,
	}
	if ($('#x').val() != "") {
		payload.cx = $('#x').val()
		payload.cy = $('#y').val()
		payload.ch = $('#h').val()
		payload.cw = $('#w').val()
	}
	$.post(
		"http://97.107.141.47:8080/gifs",
		payload,
		function(data) {
			var oldanswer = ""
			var interval = setInterval(function(){
				$.get(
					"http://97.107.141.47:8080/gifs/" + data.id,
					function(d) {
						if (typeof(d) != "object") {
							clearInterval(interval)
							$("#answer").html("")
							$("#answer").append("<img src=\"" + "http://97.107.141.47:8080/gifs/" + data.id + "\">")
						} else {
							if (oldanswer != d.status) {
								$("#answer").html(String(d.status))
								oldanswer = d.status
							} else {
								$("#answer").append(".")
							}
						}
					}
				)
			}, 1000)
			$("#answer").html(data)
		}
	)
}
function cropit() {
	var _this = this;
	if(!this.jcropEl) {
		ytplayer = document.getElementById("myytplayer");
		var el = $('#holder');
		el.width(ytplayer.width);
		el.height(ytplayer.height);
		el.Jcrop({
			onSelect: updateCoords,
		}, function() {
			var jcropEl = _this.jcropEl = el.parent();
			_this.jcropping = true;
			jcropEl.css({
				'background-color': 'transparent',
				position: 'absolute',
			});
		});
	} else if(!this.jcropping) {
		this.jcropEl.css({
			'z-index': 600,
		});
		this.jcropping = true;
	} else {
		this.jcropEl.css({
			'z-index': -10,
		});
		this.jcropping = false;
	}
}
function updateCoords(c) {
	$('#x').val(c.x);
	$('#y').val(c.y);
	$('#w').val(c.w);
	$('#h').val(c.h);
}
function init() {
	var params = { allowScriptAccess: "always", wmode: "transparent" };
	var atts = { id: "myytplayer" };
	swfobject.embedSWF(
		"http://www.youtube.com/v/ihpG_NJ_T1g?enablejsapi=1&playerapiid=ytplayer&version=3&fs=0&iv_load_policy=3&showinfo=0",
		"ytapiplayer",
		"425",
		"300",
		"8",
		null,
		null,
		params,
		atts
	);
	document.getElementById('gifit').onclick = function(){
		gifit(document.id('firstValueH').value, document.id('secondValueH').value - document.id('firstValueH').value);
	}
	document.getElementById('cropit').onclick = function(){cropit()}
	$('#url').on('input', function(){
		//https://www.youtube.com/watch?v=dgKGixi8bp8
		var input = $(this)
		var re = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/;
		var is_legit = re.exec(input.val());
		if (is_legit) {
			$("span", input.parent()).removeClass("error_show").addClass("error");
			swfobject.removeSWF("myytplayer");
			$("#holder").after('<div id="ytapiplayer"></div>');
			swfobject.embedSWF(
				"http://www.youtube.com/v/" + is_legit[1] + "?enablejsapi=1&playerapiid=ytplayer&version=3&fs=0&iv_load_policy=3&showinfo=0",
				"ytapiplayer",
				"425",
				"300",
				"8",
				null,
				null,
				params,
				atts
			);
		} else {
			$("span", input.parent()).removeClass("error").addClass("error_show");
		}
	});
}