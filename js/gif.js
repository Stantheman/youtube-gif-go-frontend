/*
* Youtube stuff
*/
var vid_length = 0;
var ready = false;
function onYouTubePlayerReady(playerId) {
	ytplayer = document.getElementById("myytplayer");
	ytplayer.addEventListener("onStateChange", "ytStateChange");
	ytplayer.mute();
	ready = true;
}
function ytStateChange(change) {
	ytplayer = document.getElementById("myytplayer");
	if ((vid_length === 0) && (change === -1)) {
		vid_length = ytplayer.getDuration();
		new DoubleSlider("slider_horizontal", {
			onStart: function (a, b) {console.log('start'); },
			onComplete: function () {console.log('complete'); },
			onChange: function (firstValue, secondValue) {
				ytplayer = document.getElementById("myytplayer");
				if (ready && document.id('firstValueH').value !== firstValue) {
					ytplayer.seekTo(firstValue, true);
				}
				document.id('firstValueH').set('value', firstValue);
				document.id('secondValueH').set('value', secondValue);
			},
			range: [0, vid_length],
			start: [0, vid_length],
			precision: 0
		});
	}
}
function gifit(start, dur) {
	var payload = {
		"url": $('#url').val(),
		"start": start,
		"dur": dur
	};
	if ($('#x').val() !== "" && $('#cropit').val() !== 'crop it?') {
		payload.cx = $('#x').val();
		payload.cy = $('#y').val();
		payload.ch = $('#h').val();
		payload.cw = $('#w').val();
	}
	$.post(
		"http://97.107.141.47:8080/gifs",
		payload,
		create_gif
	);
}

function create_gif(data) {
	var oldanswer = "",
		giflink = "97.107.141.47:8080/gifs/" + data.id,
		interval = setInterval(function () {$.get(
			"http://" + giflink,
			function (d) {
				// workaround for dumb api response
				if (typeof d !== "object") {
					clearInterval(interval);
					$("#answer").html("");
					$("#answer").append("<img src=\"http://" + giflink + "\"><br/>");
					$("#answer").append('<input type=button id="gfycat" value="gimme gfycat"><br/>');
					document.getElementById("gfycat").onclick = function () {
						$.get("http://upload.gfycat.com/transcode?fetchUrl=" + giflink,
							function (gcat) {
								console.log(gcat);
								$("#answer").append(
									'<label>gifycat:</label> <a href="http://gfycat.com/' +
										gcat.gfyName + '">' + gcat.gfyName + '</a>'
								);
							});
					};

					return;
				}
				// it's real json
				if (d.hasOwnProperty('status') && (oldanswer !== d.status)) {
					$("#answer").html(String(d.status));
					// this is bad too
					if (d.status.match("^failed at")) {
						clearInterval(interval);
					}
					oldanswer = d.status;
				} else {
					$("#answer").append(".");
				}
			}
		); }, 1000);
	$("#answer").html(data);
}

function updateCoords(c) {
	$('#x').val(c.x);
	$('#y').val(c.y);
	$('#w').val(c.w);
	$('#h').val(c.h);
}

function cropit() {
	var _this = this,
		el = $('#holder');
	if (!this.jcropEl) {
		ytplayer = document.getElementById("myytplayer");
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
	var params = { allowScriptAccess: "always" },
		atts = { id: "myytplayer" };
	swfobject.embedSWF(
		"http://www.youtube.com/v/" +
			id +
			"?enablejsapi=1&playerapiid=ytplayer&version=3&fs=0&iv_load_policy=3&showinfo=0&rel=0",
		"ytapiplayer",
		"425",
		"300",
		"8",
		null,
		null,
		params,
		atts
	);
}

function init() {
	makeSWF("ihpG_NJ_T1g");
	document.getElementById('gifit').onclick = function () {
		gifit(document.id('firstValueH').value, document.id('secondValueH').value - document.id('firstValueH').value);
	};
	document.getElementById('cropit').onclick = function () {cropit(); };

	$('#url').on('input', function () {
		var input = $(this),
			re = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_\-]{11})$/;
		var is_legit = re.exec(input.val());
		if (is_legit) {
			$("span", input.parent()).removeClass("error_show").addClass("error");
			swfobject.removeSWF("myytplayer");
			vid_length = 0;
			$("#holder").after('<div id="ytapiplayer"></div>');
			makeSWF(is_legit[1]);
		} else {
			$("span", input.parent()).removeClass("error").addClass("error_show");
		}
	});
}
