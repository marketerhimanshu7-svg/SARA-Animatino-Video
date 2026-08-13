#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Renders ieb.html to a 1080p60 MP4 with audio, using this machine's resources.
#
#   ./export/export.sh [output.mp4]
#
# How it works: the page is played once, for real, in a real browser on a
# virtual X display, while ffmpeg screen-grabs at 60fps and records the
# browser's audio off a PulseAudio null sink. The raw grab is then cropped
# (to drop the browser's own toolbar), trimmed to the click, and encoded.
#
# Needs: ffmpeg, Xvfb, pulseaudio, python3, node + playwright, chromium.
# ---------------------------------------------------------------------------
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
OUT="${1:-$ROOT/ieb-1080p60.mp4}"
WORK="$(mktemp -d)"

DISPLAY_NUM="${IEB_DISPLAY:-:99}"
PORT="${IEB_PORT:-8934}"
W=1920
CAP_H=1168          # 1080 of page + room for the browser toolbar; cropped later
FPS=60
RUN_SECONDS="${IEB_RUN_SECONDS:-56}"

echo "==> workspace $WORK"
cleanup() {
  set +e
  [ -n "${FFMPEG_PID:-}" ] && kill "$FFMPEG_PID" 2>/dev/null
  [ -n "${HTTP_PID:-}" ] && kill "$HTTP_PID" 2>/dev/null
  [ -n "${XVFB_PID:-}" ] && kill "$XVFB_PID" 2>/dev/null
  pulseaudio --kill 2>/dev/null
}
trap cleanup EXIT

# ---- virtual display -------------------------------------------------------
echo "==> starting Xvfb on $DISPLAY_NUM (${W}x${CAP_H})"
Xvfb "$DISPLAY_NUM" -screen 0 "${W}x${CAP_H}x24" -nolisten tcp >/dev/null 2>&1 &
XVFB_PID=$!
sleep 2
export DISPLAY="$DISPLAY_NUM"

# ---- audio sink we can record from ----------------------------------------
echo "==> starting PulseAudio + null sink"
pulseaudio --start --exit-idle-time=-1 >/dev/null 2>&1 || true
sleep 1
export PULSE_SERVER="$(pactl info 2>/dev/null | awk -F': ' '/Server String/{print $2}')"
pactl load-module module-null-sink sink_name=iebsink \
  sink_properties=device.description=IEBSink >/dev/null
pactl set-default-sink iebsink

# ---- serve the page --------------------------------------------------------
echo "==> serving $ROOT on :$PORT"
python3 -m http.server "$PORT" --directory "$ROOT" >/dev/null 2>&1 &
HTTP_PID=$!
sleep 1

# ---- capture ---------------------------------------------------------------
# Captured lossless-ish and fast so no frames are dropped at 60fps; the real
# encode happens afterwards, off the clock.
echo "==> capturing ${FPS}fps for ${RUN_SECONDS}s"
FF_START="$(date +%s.%N)"
# No -t here: browser start-up takes an unpredictable few seconds, so ffmpeg
# runs open-ended and is stopped once the driver has finished the whole run.
ffmpeg -y -loglevel error -nostdin \
  -thread_queue_size 2048 \
  -f x11grab -draw_mouse 0 -video_size "${W}x${CAP_H}" -framerate "$FPS" -i "$DISPLAY_NUM.0" \
  -thread_queue_size 2048 \
  -f pulse -i iebsink.monitor \
  -c:v libx264 -preset ultrafast -tune zerolatency -qp 18 -pix_fmt yuv420p \
  -c:a pcm_s16le \
  "$WORK/raw.mkv" &
FFMPEG_PID=$!
sleep 2

IEB_URL="http://localhost:$PORT/ieb.html?once=1" \
IEB_OUT="$WORK" \
IEB_RUN_SECONDS="$RUN_SECONDS" \
IEB_WIDTH="$((W + 1))" IEB_HEIGHT="$CAP_H" \
IEB_CHROME="${IEB_CHROME:-}" \
IEB_SUBS="${IEB_SUBS:-{\}}" \
  node "$HERE/record.js"

echo "==> run finished, closing capture"
kill -INT "$FFMPEG_PID" 2>/dev/null || true
wait "$FFMPEG_PID" 2>/dev/null || true
unset FFMPEG_PID

# ---- trim + crop + encode --------------------------------------------------
CLICK_AT="$(python3 -c "import json;print(json.load(open('$WORK/markers.json'))['clickedAt'])")"
CHROME_OFF="$(python3 -c "import json;print(json.load(open('$WORK/markers.json'))['chromeOffset'])")"
START="$(python3 -c "print(max(0.0, $CLICK_AT - $FF_START))")"

echo "==> click at +${START}s, cropping ${CHROME_OFF}px of browser chrome"
ffmpeg -y -loglevel error \
  -ss "$START" -i "$WORK/raw.mkv" \
  -vf "crop=${W}:1080:0:${CHROME_OFF},fps=${FPS},format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 \
  -x264-params "keyint=120:min-keyint=60" \
  -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart \
  "$OUT"

echo "==> done: $OUT"
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,avg_frame_rate -show_entries format=duration \
  -of default=noprint_wrappers=1 "$OUT"
