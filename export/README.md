# Exporting the IEB animation to video

```bash
./export/export.sh [output.mp4]        # default: ./ieb-1080p60.mp4
```

Produces **1920×1080 @ 60fps, H.264 + AAC**, with audio (the intro clip's own
sound plus the typing/enter cues).

It plays the page once, for real, in a browser on a virtual X display while
ffmpeg screen-grabs at 60fps and records the browser's audio from a PulseAudio
null sink. Nothing is simulated — what you see in the browser is what lands in
the file.

## Requirements

`ffmpeg`, `Xvfb`, `pulseaudio`, `python3`, `node`, and Playwright's Chromium.

```bash
npm i playwright && npx playwright install chromium
```

## Knobs

| env | default | meaning |
| --- | --- | --- |
| `IEB_RUN_SECONDS` | `56` | how long to record after the start click |
| `IEB_PORT` | `8934` | port for the local static server |
| `IEB_DISPLAY` | `:99` | Xvfb display to use |
| `IEB_CHROME` | Playwright's | path to a Chromium/Chrome binary |
| `IEB_SUBS` | `{}` | JSON map of URL glob → local file, swapped in at request time |

## A note on actually hitting 60fps

The container is always 60fps, but the *motion* can only be as smooth as the
machine renders it. This is a GPU-bound page — a full-screen blurred/composited
scene plus a per-frame chroma key on the orb.

- **On a machine with a working GPU** the page holds 60fps and every frame in
  the file is a distinct rendered frame.
- **On a headless box with no GPU** (software rasterisation) it renders around
  25fps, and the extra frames in the 60fps file are duplicates — the timing is
  correct but the motion is not truly 60fps.

To check what you actually got:

```bash
ffmpeg -i out.mp4 -vf mpdecimate -f null - 2>&1 | tail -2
```

That prints the number of *unique* frames. Compare it against
`duration × 60`; if it is far below, the render was GPU-starved, not the
capture.

`IEB_SUBS` exists for the same class of problem: a Chromium build without an
H.264 decoder can't play `assets/*.mp4`, so you can hand it WebM copies:

```bash
IEB_SUBS='{"**/intro.mp4":"/tmp/intro.webm"}' ./export/export.sh
```
