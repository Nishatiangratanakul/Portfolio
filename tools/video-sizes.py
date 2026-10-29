# Writes assets/video-sizes.json: the width and height of every looping video, so the pages can give
# each one its exact shape before it loads (no small-then-big jump). Run again after adding a video:
#   python3 tools/video-sizes.py
import json, os, subprocess
sizes = {}
for root, _, files in os.walk('assets'):
    for f in files:
        if f.lower().endswith('.mp4'):
            path = os.path.join(root, f)
            out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height',
                                  '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
            if out:
                w, h = map(int, out.split(',')[:2])
                sizes[os.path.relpath(path, 'assets')] = [w, h]
json.dump(dict(sorted(sizes.items())), open('assets/video-sizes.json', 'w'), separators=(',', ':'))
print(len(sizes), 'videos')
