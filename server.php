<?php
  if(isset($_POST['task_parameters']) && !empty($_POST['task_parameters'])) {
    $task_data = $_POST['task_parameters'];
    $data = json_decode(stripslashes($task_data));
    $filename = "data/task_" . $data->task_id . ".json";
    file_put_contents($filename, $task_data);
  }    
?>
