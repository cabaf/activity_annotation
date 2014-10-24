<?php
  if(isset($_POST['task_parameters']) && !empty($_POST['task_parameters'])) {
    $task_data = $_POST['task_parameters'];
    $data = json_decode(stripslashes($task_data));
    $filename = "data/task_" . $data->task_id . ".json";
    file_put_contents($filename, $task_data);
    
  }
/*
  $js = '{"description":["Long Jump","The long jump is a track and field event in which athletes combine speed, strength, and agility in an attempt to leap as far as possible from a take off point."],"hit_id":"0001","segments":[[5.098,47.044]],"urls":["media/video_test_0000242_left.mp4","media/video_test_0000242.mp4","media/video_test_0000242_right.mp4"],"worker_id":"FabianCaba"}';
  $data = json_decode(stripslashes($js));
  print_r($data);
  print_r($data->hit_id);
  $filename = "data/task_" . $data->hit_id;
  $json_ = json_encode($data);
  file_put_contents($filename, $json_);*/
?>
