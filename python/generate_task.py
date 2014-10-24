#!/usr/bin/python

import json
import os
import sys

from config import PROJECT_PATH

def simulate_players(task_json):
    with open(task_json, 'r') as fobj:
        task_data = json.load(fobj)
    for task_id in task_data:
        v_urls = task_data[task_id]["urls"]
        if not os.path.isfile(os.path.join(PROJECT_PATH, v_urls[1])):
            print 'Warning: video file %s not exists.' % os.path.join(PROJECT_PATH, v_urls[0])
            continue
        if not os.path.isfile(os.path.join(PROJECT_PATH, v_urls[0])):
            cmd = 'ln -s %s %s' % (os.path.join(PROJECT_PATH, v_urls[1]),
                                   os.path.join(PROJECT_PATH, v_urls[0]))
            print 'Creating symbolic link: %s' % cmd
            os.system(cmd)
        if not os.path.isfile(os.path.join(PROJECT_PATH, v_urls[2])):
            cmd = 'ln -s %s %s' % (os.path.join(PROJECT_PATH, v_urls[1]),
                                   os.path.join(PROJECT_PATH, v_urls[2]))
            print 'Creating symbolic link: %s' % cmd
            os.system(cmd)

def print_task_dictionary(video_json, activity_json, task_json):
    with open(video_json, 'r') as fobj:
        video_data = json.load(fobj)
    with open(activity_json, 'r') as fobj:
        activity_data = json.load(fobj)
    task = {}
    cnt = 1
    for idx in video_data:
        this_class_id = str(video_data[idx]['label'])
        activity_name = activity_data[this_class_id]["activity_name"]
        description = [activity_name,
                       activity_data[this_class_id]["description"]]
        task_id = '%04d' % cnt
        url = idx
        url_left = "%s/%s_left.mp4" % (os.path.dirname(url),
                                       os.path.basename(url).split('.mp4')[0])
        url_right = "%s/%s_right.mp4" % (os.path.dirname(url),
                                         os.path.basename(url).split('.mp4')[0])
        task[task_id] = {"assignment_id": None,
                         "segments": [],
                         "worker_id": None,
                         "urls": [url_left, url, url_right],
                         "description": description,
                         "task_id": task_id}
        cnt += 1
    with open(task_json, 'w') as fobj:
        fobj.write(json.dumps(task))

if __name__ == '__main__':
    args = sys.argv[1:]
    if (len(args)!=3):
        print 'Usage %s video.json activity.json task.json' % sys.argv[0]
        sys.exit(0)
    print_task_dictionary(args[0], args[1], args[2])
    simulate_players(args[2])
