"""An original soundtrack for the brand film, composed in code (no samples,
no third-party music), so it is free of copyright and locked to the cuts.

100 BPM in D minor (Dm - Bb - F - C). The bar grid is anchored on the first
punch ("Sites.", frame 290), which is the drop.

  0.0 - 2.0   dark drone, the dot's heartbeat, the fall
  2.0         impact: the horizon lights up
  2.0 - 9.7   build: pad, pulsing bass opening up, arpeggio, snare roll, riser
  9.7         DROP on "Sites." - kick, claps, hats, bass, arp, stabs on the punches
 27.7 - 32.5  breakdown on "Belo Horizonte": drums out, filtered pad, pings, riser
 32.5         final impact on the profile picture, last chord rings out

Run: python3 score.py  ->  public/audio/score.wav
"""
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
FPS = 30
DUR = 1080 / FPS + 0.3
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)

BPM = 100
BEAT = 60 / BPM
S16 = BEAT / 4
BAR = 4 * BEAT
DROP = 290 / FPS
IGNITE = 60 / FPS
ZOOM = 294 / FPS
BREAK = 830 / FPS
ORB = 946 / FPS
POP = 974 / FPS
SLAMS = [290 / FPS, 326 / FPS, 362 / FPS]
CUTS = [160, 432, 530, 566, 606, 648, 766, 852]


def fr(frame):
    return frame / FPS


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def sec(x):
    return int(round(x * SR))


# ---------------------------------------------------------------- dsp tools
def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x)


def sweep_lp(x, cut):
    """Low-pass whose cutoff follows the array `cut`, in 256-sample blocks."""
    out = np.zeros_like(x)
    zi = None
    B = 256
    for i in range(0, len(x), B):
        c = float(np.clip(cut[min(i + B // 2, len(cut) - 1)], 40, SR * 0.45))
        sos = butter(2, c, "low", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + B], zi = sosfilt(sos, x[i:i + B], zi=zi)
    return out


def saw(f, n, phase=0.0, harmonics=None):
    """Band-limited saw by additive synthesis."""
    tt = np.arange(n) / SR
    kmax = harmonics or max(1, int(SR * 0.45 / f))
    kmax = min(kmax, 40)
    y = np.zeros(n)
    for k in range(1, kmax + 1):
        y += np.sin(2 * np.pi * k * f * tt + phase * k) / k
    return y * (2 / np.pi)


def env_adsr(n, a, d, s, r_start, r):
    tt = np.arange(n) / SR
    e = np.where(tt < a, tt / max(a, 1e-4), s + (1 - s) * np.exp(-(tt - a) / max(d, 1e-4)))
    rel = np.clip((tt - r_start) / max(r, 1e-4), 0, 1)
    return e * (1 - rel)


def place(dst, src, at, gain=1.0):
    i = sec(at)
    if i >= len(dst) or i + len(src) <= 0:
        return
    j0 = max(0, -i)
    n = min(len(src) - j0, len(dst) - max(i, 0))
    dst[max(i, 0):max(i, 0) + n] += src[j0:j0 + n] * gain


def reverb_ir(seconds, seed):
    r = np.random.default_rng(seed)
    n = sec(seconds)
    tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt / (seconds / 6.5))
    ir = lp(ir, 7000)
    ir[: sec(0.012)] *= np.linspace(0, 1, sec(0.012))
    return ir / np.sqrt(np.sum(ir**2))


IR_L, IR_R = reverb_ir(2.6, 1), reverb_ir(2.6, 2)


def verb(x):
    return fftconvolve(x, IR_L)[:N], fftconvolve(x, IR_R)[:N]


# ---------------------------------------------------------------- buses
L = np.zeros(N)
R = np.zeros(N)
send = np.zeros(N)  # mono reverb send


def to_bus(x, gain=1.0, pan=0.0, rev=0.0):
    global L, R, send
    L += x * gain * np.sqrt(0.5 * (1 - pan))
    R += x * gain * np.sqrt(0.5 * (1 + pan))
    send += x * gain * rev


# ---------------------------------------------------------------- the grid
# bars counted from the drop; negative bars lead into it
def bar_start(k):
    return DROP + k * BAR


CHORDS = [  # root, chord tones (midi)
    (38, [62, 65, 69, 74]),  # Dm
    (34, [58, 62, 65, 70]),  # Bb
    (41, [60, 65, 69, 72]),  # F
    (36, [60, 64, 67, 72]),  # C
]


def chord_at(time):
    k = int(np.floor((time - DROP) / (2 * BAR)))
    return CHORDS[k % 4]


# ---------------------------------------------------------------- drums
def kick_sample(punch=1.0):
    n = sec(0.45)
    tt = np.arange(n) / SR
    f = 42 + 130 * np.exp(-tt / 0.028)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-tt / 0.24)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-tt / 0.004) * 0.3
    return np.tanh((body + 0.3 * np.sin(ph) * np.exp(-tt / 0.05) * punch + click) * 1.4)


def clap_sample():
    n = sec(0.5)
    tt = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 900, 3500)
    e = np.zeros(n)
    for o in (0, 0.011, 0.022):
        e += np.where(tt >= o, np.exp(-(tt - o) / 0.006), 0) * 0.6
    e += np.where(tt >= 0.03, np.exp(-(tt - 0.03) / 0.09), 0)
    return nz * e


def snare_sample():
    n = sec(0.3)
    tt = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / 0.05)
    nz = bp(rng.standard_normal(n), 1200, 7000) * np.exp(-tt / 0.08)
    return tone * 0.5 + nz


def hat_sample(open_=False):
    n = sec(0.35 if open_ else 0.06)
    tt = np.arange(n) / SR
    return lp(hp(rng.standard_normal(n), 7000), 13000) * np.exp(-tt / (0.09 if open_ else 0.018))


KICK = kick_sample()
CLAP = clap_sample()
SNARE = snare_sample()
HAT_C = hat_sample()
HAT_O = hat_sample(True)

kick_bus = np.zeros(N)
drums = np.zeros(N)
kick_times = []


def kick(at, g=1.0):
    place(kick_bus, KICK, at, g)
    kick_times.append(at)


# heartbeat in the dark
for hb in (fr(24), fr(36)):
    place(kick_bus, lp(KICK, 200), hb, 0.7)
    place(kick_bus, lp(KICK, 200), hb + 0.16, 0.45)

# groove from the drop to the breakdown
groove_end = BREAK
b = DROP
step = 0
while b < groove_end - 0.01:
    beat_in_bar = step % 4
    kick(b, 1.0 if beat_in_bar == 0 else 0.9)
    if beat_in_bar in (1, 3):
        place(drums, CLAP, b, 0.55)
        send[sec(b):sec(b) + len(CLAP)] += CLAP[: max(0, min(len(CLAP), N - sec(b)))] * 0.25
    place(drums, HAT_O, b + BEAT / 2, 0.08)
    place(drums, HAT_C, b + BEAT / 4, 0.035)
    place(drums, HAT_C, b + 3 * BEAT / 4, 0.05)
    b += BEAT
    step += 1

# snare roll into the drop (two bars, accelerating)
roll_start = DROP - 2 * BAR
k = 0
tt_ = roll_start
while tt_ < DROP - 0.02:
    prog = (tt_ - roll_start) / (2 * BAR)
    div = BEAT / 2 if prog < 0.5 else (BEAT / 4 if prog < 0.85 else BEAT / 8)
    place(drums, SNARE, tt_, 0.12 + 0.35 * prog)
    tt_ += div
# a few soft kicks in the build to keep a pulse
for i in range(8):
    kick(DROP - 4 * BAR + i * BAR / 2, 0.45)

# final section: a slow, heavy pulse
for i in range(1, 6):
    kick(POP + i * 2 * BEAT, 0.5)

# ---------------------------------------------------------------- sidechain
duck = np.ones(N)
for kt in kick_times:
    i = sec(kt)
    if 0 <= i < N:
        duck[i:] *= 1 - 0.55 * np.exp(-(np.arange(N - i) / SR) / 0.14)

# ---------------------------------------------------------------- pad
pad = np.zeros(N)
k = -6
while bar_start(k) < DUR:
    a = bar_start(k)
    n = sec(2 * BAR + 0.8)
    _, tones = CHORDS[(k // 2) % 4]
    seg = np.zeros(n)
    for m in tones:
        for d in (-0.1, 0.0, 0.09):
            seg += saw(midi(m + d), n, rng.uniform(0, 6), harmonics=24)
    seg *= env_adsr(n, 0.5, 1.0, 1.0, 2 * BAR + 0.1, 0.7) / 12
    place(pad, seg, a)
    k += 2
pad_cut = np.interp(t, [0, IGNITE, DROP - 0.2, DROP, BREAK, BREAK + 0.5, POP - 0.5, POP, DUR],
                    [250, 400, 2600, 1500, 1500, 600, 2200, 2400, 900])
pad = sweep_lp(pad, pad_cut)
pad_gain = np.interp(t, [0, IGNITE, IGNITE + 2, DUR - 1.5, DUR], [0.25, 0.4, 1, 1, 0])
pad *= pad_gain

# ---------------------------------------------------------------- bass
bass = np.zeros(N)
b = DROP - 4 * BAR
while b < POP + 4 * BAR:
    root, _ = chord_at(b)
    for e in range(2):  # 8th notes, the off-beat a bit louder
        at = b + e * BEAT / 2
        if at > DUR:
            break
        n = sec(BEAT / 2)
        f0 = midi(root)
        note = saw(f0, n, harmonics=18) * 0.6 + np.sin(2 * np.pi * f0 / 2 * np.arange(n) / SR) * 0.9
        note *= env_adsr(n, 0.004, 0.25, 0.7, BEAT / 2 - 0.03, 0.03)
        place(bass, note, at, 0.85 if e else 0.65)
    b += BEAT
bass_cut = np.interp(t, [0, DROP - 4 * BAR, DROP - 0.1, DROP, BREAK, BREAK + 0.3, POP - 1, POP, DUR],
                     [120, 160, 1100, 700, 700, 140, 400, 900, 300])
bass = sweep_lp(bass, bass_cut)
bass_gain = np.interp(t, [0, DROP - 4 * BAR - 0.01, DROP - 4 * BAR, BREAK, BREAK + 0.6, POP - 0.01, POP, DUR - 1, DUR],
                      [0, 0, 0.7, 1, 0.35, 0.35, 0.9, 0.6, 0])
bass *= bass_gain

# ---------------------------------------------------------------- arpeggio
arp = np.zeros(N)
arp_on = [(DROP - 2 * BAR, BREAK + 2 * BAR), (POP, DUR - 1)]
pattern = [0, 1, 2, 3, 2, 1, 2, 3]
for a, z in arp_on:
    tt_ = bar_start(np.ceil((a - DROP) / BAR))
    i = 0
    while tt_ < z:
        _, tones = chord_at(tt_)
        m = tones[pattern[i % len(pattern)]] + 12
        n = sec(0.32)
        x = saw(midi(m), n, harmonics=14) * 0.5 + np.sign(np.sin(2 * np.pi * midi(m) * np.arange(n) / SR)) * 0.15
        x = lp(x * np.exp(-np.arange(n) / SR / 0.09), 4200)
        place(arp, x, tt_, 0.5 if i % 4 == 0 else 0.36)
        tt_ += S16 * 2
        i += 1
arp_gain = np.interp(t, [0, DROP - 2 * BAR, DROP - 0.1, BREAK, BREAK + 2 * BAR, POP, DUR - 1, DUR], [0, 0.35, 0.8, 0.8, 0.0, 0.55, 0.4, 0])
arp_cut = np.interp(t, [0, DROP - 2 * BAR, DROP, BREAK, BREAK + 2 * BAR, DUR], [800, 900, 5000, 5000, 900, 3000])
arp = sweep_lp(arp * arp_gain, arp_cut)

# ---------------------------------------------------------------- stabs on the punches
stabs = np.zeros(N)
for at, chord in zip(SLAMS, [CHORDS[0], CHORDS[0], CHORDS[1]]):
    n = sec(0.9)
    x = np.zeros(n)
    for m in chord[1]:
        for d in (-0.12, 0.12):
            x += saw(midi(m + d), n, harmonics=30)
    x = lp(x * np.exp(-np.arange(n) / SR / 0.22), 3500) / 6
    place(stabs, x, at, 1.0)

# ---------------------------------------------------------------- fx
fx = np.zeros(N)
noise = rng.standard_normal(N)


def impact(at, g=1.0):
    n = sec(2.5)
    tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (34 + 20 * np.exp(-tt / 0.08)) * tt) * np.exp(-tt / 1.1)
    crash = lp(hp(rng.standard_normal(n), 2500), 8000) * np.exp(-tt / 0.3) * 0.16
    place(fx, boom + crash, at, g)
    place(kick_bus, KICK, at, 1.2 * g)
    i = sec(at)
    send[i:i + n] += crash[: max(0, min(n, N - i))] * 0.25 * g


def riser(start, end, g=0.2, lo=500, hi=9000):
    w = np.clip((t - start) / (end - start), 0, 1) ** 2.5 * (t < end)
    x = bp(noise, lo, min(hi, 6000)) * w
    return x * g


def whoosh(end, length=0.55, g=0.16):
    w = np.clip((t - (end - length)) / length, 0, 1) ** 2 * (t < end + 0.25) * np.exp(-np.clip(t - end, 0, None) / 0.08)
    return bp(noise, 400, 5000) * w * g


def blip(at, m=86, g=0.08):
    n = sec(0.6)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * midi(m) * tt) + 0.4 * np.sin(2 * np.pi * midi(m + 12) * tt)) * np.exp(-tt / 0.16)
    place(fx, x, at, g)
    i = sec(at)
    send[i:i + n] += x[: max(0, min(n, N - i))] * g * 1.5


impact(IGNITE, 1.0)
impact(DROP, 0.8)
impact(POP, 1.0)
fx += riser(fr(44), IGNITE, 0.07)
fx += riser(DROP - 2 * BAR, DROP, 0.1)
fx += riser(POP - 2.6, POP, 0.1)
blip(fr(114), 86)
blip(fr(126), 88)
blip(fr(214), 81, 0.1)
for c in CUTS:
    fx += whoosh(fr(c))
for k in range(4):
    blip(fr(880 + k * 14), 93, 0.04)
# the dive through the Z
zw = np.clip((t - (ZOOM - 1.1)) / 1.1, 0, 1) ** 3 * (t < ZOOM + 0.2) * np.exp(-np.clip(t - ZOOM, 0, None) / 0.1)
fx += bp(noise, 300, 9000) * zw * 0.22

# ---------------------------------------------------------------- mix
music_l = np.zeros(N)
music_r = np.zeros(N)
music_l += pad * 0.8 * duck
music_r += pad * 0.8 * duck
send += pad * 0.35
music_l += bass * 0.5 * duck
music_r += bass * 0.5 * duck
# arp ping-pong
arp_l = arp.copy()
arp_r = np.zeros(N)
d = sec(S16 * 3)
arp_r[d:] = arp[:-d] * 0.7
music_l += arp_l * 0.42 * duck
music_r += arp_r * 0.42 * duck
send += arp * 0.3
music_l += stabs * 0.55
music_r += stabs * 0.55
send += stabs * 0.4
dl, dr = drums * 0.9, drums * 0.9
# hats a little to the right, claps centred
music_l += dl
music_r += dr
music_l += kick_bus * 0.8
music_r += kick_bus * 0.8
music_l += fx * 0.9
music_r += fx * 0.9

rl, rr = verb(hp(send, 250))
music_l += rl * 0.35
music_r += rr * 0.35

# drone under the intro
drone = np.sin(2 * np.pi * midi(26) * t) * np.clip(t / 1.5, 0, 1) * np.clip((IGNITE + 1 - t) / 1.0, 0, 1)
music_l += drone * 0.25
music_r += drone * 0.25

# ---- master: tame the top, gentle bus compression, soft clip, fade, normalize
mix = np.stack([lp(music_l, 12000), lp(music_r, 12000)], 1)
level = lp(np.abs(mix).max(1), 8)
gain = 1 / np.maximum(1, (level / (np.percentile(level, 90) + 1e-9)) ** 0.5)
mix *= gain[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6)
fade = np.clip((DUR - 0.15 - t) / 1.2, 0, 1) * np.clip(t / 0.05, 0, 1)
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) / 0.93

with wave.open("public/audio/score.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("ok", round(DUR, 2), "s")
