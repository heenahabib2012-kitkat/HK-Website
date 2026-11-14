#!/usr/bin/env bash
# HK brand film — edit + grade from the supplied stock clips.
# Order: curved glass (detail) -> Downtown Dubai at night (the city) -> Burj Khalifa tilt-up (the icon)
set -euo pipefail
# Source clips (not committed): put them in footage/ or pass FOOTAGE_DIR=...
U=${FOOTAGE_DIR:-footage}
GLASS="$U/glass.mp4"   # 1440x2560 portrait, curved glass facade (Pexels 16810046)
NIGHT="$U/night.mp4"   # 1920x1080, Downtown Dubai at night (Pexels 11284796)
BURJ="$U/burj.mp4"     # 2160x3840 portrait, Burj Khalifa (Pexels 13348956)
OUT=${1:-src/assets/video}
mkdir -p "$OUT"

# Brand grade: deep royal-blue shadows, champagne highlights, restrained saturation, vignette, fine grain
GRADE_DAY="curves=r='0/0 0.45/0.30 1/0.70':g='0/0 0.45/0.34 1/0.76':b='0/0.04 0.45/0.45 1/0.90',eq=contrast=1.06:saturation=0.85,colorbalance=rh=0.06:gh=0.03:bh=-0.04"
GRADE_GLASS="curves=r='0/0 0.45/0.24 1/0.52':g='0/0 0.45/0.29 1/0.60':b='0/0.04 0.45/0.40 1/0.80',eq=contrast=1.08:saturation=0.8,colorbalance=rh=0.05:gh=0.02:bh=-0.03"
GRADE_NIGHT="eq=brightness=-0.03:contrast=1.06:saturation=0.78,colorbalance=rs=-0.04:bs=0.06:rh=0.12:gh=0.06:bh=-0.10"
FINISH="vignette=angle=PI/4.2,noise=alls=5:allf=t,format=yuv420p"

build() {
  local W=$1 H=$2 FILE=$3 CRF=$4
  if [ "$W" -gt "$H" ]; then
    # landscape
    G="[0:v]trim=start=2:duration=6.5,setpts=PTS-STARTPTS,crop=1440:810:0:'(ih-810)*0.30-(t*18)',scale=${W}:${H}:flags=lanczos,fps=30,${GRADE_GLASS},setsar=1[g]"
    N="[1:v]setpts=1.3*PTS,fps=30,scale=3840:-2:flags=lanczos,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=30,trim=duration=6.2,setpts=PTS-STARTPTS,${GRADE_NIGHT},setsar=1[n]"
    B="[2:v]trim=start=0.5:duration=9,setpts=PTS-STARTPTS,fps=30,crop=2160:1215:0:'(ih-1215)*(1-t/9)',scale=${W}:${H}:flags=lanczos,${GRADE_DAY},setsar=1[b]"
  else
    # portrait (phones)
    G="[0:v]trim=start=2:duration=6.5,setpts=PTS-STARTPTS,scale=${W}:${H}:flags=lanczos,fps=30,${GRADE_GLASS},setsar=1[g]"
    N="[1:v]setpts=1.3*PTS,fps=30,crop=608:1080,scale=1080:1920:flags=lanczos,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=30,trim=duration=6.2,setpts=PTS-STARTPTS,${GRADE_NIGHT},setsar=1[n]"
    B="[2:v]trim=start=0.5:duration=9,setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,zoompan=z='1.12-0.0004*on':x='iw/2-(iw/zoom/2)':y='0':d=1:s=${W}x${H}:fps=30,${GRADE_DAY},setsar=1[b]"
  fi
  # cross-fades between shots; dip from/to dark at the loop point so it repeats seamlessly
  X="[g][n]xfade=transition=fade:duration=1.1:offset=5.4[gn];[gn][b]xfade=transition=fadeblack:duration=1.1:offset=10.5,${FINISH},fade=t=in:st=0:d=0.8:color=0x081A3A,fade=t=out:st=18.6:d=0.8:color=0x081A3A[v]"
  ffmpeg -v error -y -i "$GLASS" -i "$NIGHT" -i "$BURJ" -filter_complex "$G;$N;$B;$X" -map "[v]" -t 19.4 \
    -c:v libx264 -profile:v high -preset slow -crf "$CRF" -pix_fmt yuv420p -movflags +faststart -an "$OUT/$FILE"
}

build 1920 1080 hk-brand-film.mp4 26
build 720 1280 hk-brand-film-mobile.mp4 27
ls -la "$OUT"
