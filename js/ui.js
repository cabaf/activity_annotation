(function () {
  DEVEL = true;
  SLIDER_COUNT = 1;
  SLIDER_ARRAY = [];
  JSON_FILE = "data/task.json";
  player_end_time = 0;

  function print_log(msg) {
    if (DEVEL) {
        console.log(msg);
    }
  }

  function main_ui() {
    retval = get_parameters();
    boot_ui(JSON_FILE, retval);
  }

  function boot_ui(json_file, retval) {
    $.getJSON(json_file, function(json){
      task_parameters = json[retval.taskId];
      if ((retval.assignmentId !== null) && (typeof retval.assignmentId !== 'undefined') && (retval.assignmentId !== 'ASSIGNMENT_ID_NOT_AVAILABLE')) {
        var html_to_fill = "#submit_div";
        $(html_to_fill).html("<button type='button' class='btn btn-primary btn-sm btn-block' id='submit_task'> <b>Submit HIT</b></button>");
      }
      build_ui(task_parameters);
    });
  }

  function build_ui(task_parameters) {
    build_task_description(task_parameters["description"]);
    build_video_players(task_parameters["urls"]);
    click_events();
  }

  function click_events() {
    var html_id = "#add_instance";
    $(html_id).on('click', function (e) {
      add_slider();
    });
    var html_id = "#submit_task";
    $(html_id).on('click', function (e) {
      submit_task(task_parameters);
    });
  }

  function get_annotations() {
    var instances = Array();
    for (var idx = 0; idx < SLIDER_ARRAY.length; idx++) {
      var instance_start = $(SLIDER_ARRAY[idx]).slider("values", 0) / slider_resolution;
      var instance_end = $(SLIDER_ARRAY[idx]).slider("values", 1) / slider_resolution;
      instances[idx] = [instance_start, instance_end];
    }
    return instances
  }

  function check_annotations(annotations) {
    state = true
    for (var idx = 0; idx < annotations.length; idx++) {
      if (annotations[idx][0]==0 && annotations[idx][1]==video_duration) {
        state = false;
      }
      // non-overlapping segments.
      for(var jdx = idx+1; jdx < annotations.length; jdx++) {
        if (((annotations[idx][1] - annotations[jdx][0]) > 0) && ((annotations[idx][0] - annotations[jdx][1]) < 0)) {
          state = false;
        }
      }
    }
    return state
  }

  function send_to_amt(assignment_id, worker_id) {
  if (DEVEL) {
    var amt_url = "https://workersandbox.mturk.com/mturk/externalSubmit";
  }
  else {
    var amt_url = "https://www.mturk.com/mturk/externalSubmit";
  }
  var html_form = sprintf("<form id='amt_form' name='result' method='post' action='%s'>" +
                          "<input type='hidden' name='assignmentId' value='%s'>" +
                          "<input type='hidden' name='workerId' value='%s'>" +
                          "</form>", amt_url, assignment_id, worker_id);
  $("body").append(html_form);
  $("#amt_form").submit();
  }

  function submit_task() {
    if (SLIDER_ARRAY.length > 0) {
      var annotations = get_annotations();
      if (check_annotations(annotations)) {
        task_parameters["segments"] = annotations;
        task_parameters["worker_id"] = retval.workerId;
        task_parameters["assignment_id"] = retval.assignmentId;
        var task_json = JSON.stringify(task_parameters);
        $.ajax({
          url: 'server.php',
          type: "POST",
          dataType: 'json',
          data: {task_parameters: task_json},
          timeout: 5000,
          success:  function(output) {
            alert(output.Address);
          },
        });
        send_to_amt(retval.assignmentId, retval.workerId);
      }
      else {
        alert("You must provide tighter annotations. Please make an effort on make this task!")
      }
    }
    else {
      alert("You must annotate at least one instance of the activity.");
    }
  }

  function build_task_description(description) {
    var html_to_fill = "#task";
    var html_to_print = sprintf("<h2>Beat the machine</h2>" +
                                "<p>Please help us to find the starting " + 
                                "and ending frames for instances of the following " + 
                                "activity:</p> <h5><b>%s: </b><small>%s</small></h5>", description[0], description[1]);
    $(html_to_fill).html(html_to_print);
    print_log("Task description built...");
  }

  function build_video_players(video_url) {
    /* Initialize the video players.
       - Left player: for handling start frames.
       - Center player: to visualize selected segments.
       - Right player: for handling end frames.
    */
    // Hard-coded parameters
    var width = 360;
    var height = 220;

    // html elements for video players.
    html_id_vplayer = ["vplayer_left", "vplayer_center", "vplayer_right"]; // Globally set!
    var html_div_player = ["#video_player_left", "#video_player_main",
                           "#video_player_right"];
    /*var video_url = [sprintf("media/video_test_%s_left.mp4", video_id),
                     sprintf("media/video_test_%s.mp4", video_id),
                     sprintf("media/video_test_%s_right.mp4", video_id)];*/
    for (var idx = 0; idx < html_id_vplayer.length; idx++) {
      var html_to_print = sprintf("<video id='%s' class='video-js vjs-default-skin'" +
                                  "width='%d' height='%d'>" +
                                  "<source src='%s'" +
                                  "type='video/mp4' />", html_id_vplayer[idx],
                                                         width, height, video_url[idx]);
      $(html_div_player[idx]).html(html_to_print);
    }

    // Force video players to be ready before creating sliders.
    var player_opts = { "controls": false, "autoplay": false, "preload": "auto" }
    videojs(html_id_vplayer[0], player_opts).ready(function(){
      videojs(html_id_vplayer[1], player_opts).ready(function(){
        this.on("timeupdate", pause_at_target);
        videojs(html_id_vplayer[2], player_opts).ready(function(){
          this.on("loadedmetadata", function(){
            video_duration = this.duration(); // Globally set!
            this.currentTime(video_duration);
            print_log("Video players was built...");
            add_slider();
          });
        });
      });
    });
  }

  function pause_at_target() {
    if (videojs(html_id_vplayer[1]).currentTime() > player_end_time) {
      videojs(html_id_vplayer[1]).player().pause();
    }
  }

  function add_slider() {
    // Hard-coded parameters
    slider_resolution = 1000.0;
    var duration = video_duration;
    var html_to_fill = "#annotations";

    var row_id = sprintf("annotation_%02d", SLIDER_COUNT);
    var play_id = sprintf("play_%02d", SLIDER_COUNT);
    var slider_id = sprintf("slider_%02d", SLIDER_COUNT);
    var info_id = sprintf("info_%02d", SLIDER_COUNT);
    var del_id = sprintf("delete_%02d", SLIDER_COUNT);
    var html_to_print = sprintf(
      "<div class='row' style='margin-top: 7px;' id='%s'><div class='col-md-1'></div><div class='col-md-1'>" +
      "<button type='button' class='btn btn-success btn-xs' id='%s'> Play selection </button></div>" +
      "<div class='col-md-7'><div id='%s' style='margin-top: 5px'></div></div>" +
      "<div class='col-md-2'><div id='%s' style='border:0; color:#6599FF; font-weight:bold;'></div></div>" +
      "<div class='col-md-1'><button type='button' class='btn btn-danger btn-xs' id='%s'> Delete </button></div></div>",
      row_id, play_id, slider_id, info_id, del_id);
    $(html_to_fill).append(html_to_print);
    // Creating slider.
    $("#" + slider_id).slider({
      range: true,
      min: 0,
      max: Math.floor(duration * slider_resolution),
      step: 1,
      values: [0, Math.floor(duration * slider_resolution)],
      slide: function(event, ui) {
        $("#" + info_id).html(sprintf("<span>[%0.2fs - %0.2fs]</span>",  
                                      ui.values[0] / slider_resolution,
                                      ui.values[1] / slider_resolution));
        videojs(html_id_vplayer[0]).currentTime(ui.values[0] / slider_resolution);
        videojs(html_id_vplayer[2]).currentTime(ui.values[1] / slider_resolution);
      }
    });
    SLIDER_ARRAY.push("#" + slider_id);
    // Printing default values.
    $("#" + info_id).html(sprintf("<span>[%0.2fs - %0.2fs]</span>",
                                  $("#" + slider_id).slider("values", 0) / slider_resolution,
                                  $("#" + slider_id).slider("values", 1) / slider_resolution));
    // Define play between action.
    $("#" + play_id).on("click", function (e) {
      play_between(html_id_vplayer[1],
                  $("#" + slider_id).slider("values", 0) / slider_resolution,
                  $("#" + slider_id).slider("values", 1) / slider_resolution);
    });
    // Define delete action.
    $("#" + del_id).on('click', function (e) {
       $("#" + row_id).remove();
       var index = SLIDER_ARRAY.indexOf("#" + slider_id);
       if (index > -1) {
         SLIDER_ARRAY.splice(index, 1);
       }
    });
    print_log("Slider loaded...");
    SLIDER_COUNT += 1;
  }

  function play_between(v_id, start, end) {
    var vplayer = videojs(v_id, {});
    vplayer.currentTime(start);
    player_end_time = end;
    vplayer.player().play();
  }

  function get_parameters() {
    /* Catch GET parameters in the url. */
    var retval = new Object();
    if (window.location.href.indexOf("?") == -1)
    {
      retval.workerId = null;
      retval.assignmentId = null;
      retval.taskId = null;
      retval.hl = null;
      return retval;
    }
    var params = window.location.href.split("?")[1].split("&");
    for (var i in params)
    {
      var sp = params[i].split("=");
      if (sp.length <= 1)
      {
         continue;
      }
      var result = sp[1].split("#")[0];
      if (sp[0] == "workeId")
      {
        retval.workerId = result;
      }
      else if (sp[0] == "assignmentId")
      {
        retval.assignmentId = result;
      }
      else if (sp[0] == "taskId")
      {
        retval.taskId = result;
      }
      else
      {
        retval[sp[0]] = result;
      }
    }
    return retval
  }

ACTIONTURK.main_ui = main_ui;
})();
