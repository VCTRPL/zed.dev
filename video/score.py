"""Synthesizes the brand film's soundtrack, cut to the video's timeline.

Heartbeat thumps for the dot, an impact when it lights the horizon, a pad
from there on, a beat after the dive through the Z, hits on every punch,
whooshes on the cuts and a final impact when the orb pops.
Run: python3 score.py  ->  public/audio/score.wav
"""
import wave
import numpy as np

SR = 44100
FPS = 30
DUR = 1080 / FPS + 0.3
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
noise = rng.standard_normal(N)


def s(frame):
    return frame / FPS


def filt(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    if hi:
        X *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        X *= 1 - 1 / np.sqrt(1 + (f / lo) ** 4)
    return np.fft.irfft(X, len(x))


def env(start, attack, release, length=None):
    e = np.zeros(N)
    i0 = int(start * SR)
    if i0 >= N:
        return e
    seg = np.arange(N - i0) / SR
    shape = np.where(seg < attack, seg / max(attack, 1e-6), np.exp(-(seg - attack) / release))
    if length:
        shape[int(length * SR):] = 0
    e[i0:] = shape
    return e


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


L = np.zeros(N)
R = np.zeros(N)


def add(sig, gain=1.0, pan=0.0):
    global L, R
    L += sig * gain * np.sqrt(0.5 * (1 - pan))
    R += sig * gain * np.sqrt(0.5 * (1 + pan))


def kick(at, gain=1.0, tail=0.22):
    i = int(at * SR)
    if i >= N:
        return
    n = min(int(0.6 * SR), N - i)
    x = np.arange(n) / SR
    fr = 44 + 120 * np.exp(-x / 0.03)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    k = np.sin(ph) * np.exp(-x / tail) + 0.25 * np.tanh(3 * np.sin(ph)) * np.exp(-x / 0.05)
    L[i:i + n] += k * gain * 0.6
    R[i:i + n] += k * gain * 0.6


def impact(at, gain=1.0, bells=True):
    kick(at, 1.6 * gain, 0.3)
    add(np.sin(2 * np.pi * 34 * t) * env(at, 0.005, 1.5), 0.45 * gain)
    add(filt(noise, 2500, 14000) * env(at, 0.002, 0.9), 0.17 * gain)
    if bells:
        for n, p in [(74, -0.5), (78, 0.4), (81, -0.2), (86, 0.3), (90, 0.0)]:
            add(np.sin(2 * np.pi * midi(n) * t) * env(at + 0.01, 0.004, 1.7), 0.05 * gain, p)


def whoosh(end, length=0.55, gain=0.16, pan=0.0, lo=400, hi=5000):
    start = end - length
    w = np.clip((t - start) / length, 0, 1) ** 2 * (t < end + 0.25) * np.exp(-np.clip(t - end, 0, None) / 0.08)
    add(filt(noise, lo, hi) * w, gain, pan)


def blip(at, note=86, gain=0.06):
    add(np.sin(2 * np.pi * midi(note) * t) * env(at, 0.002, 0.18), gain)
    add(np.sin(2 * np.pi * midi(note + 12) * t) * env(at, 0.002, 0.08), gain * 0.4)


IGNITE, LOGO, ZOOM, ORB, POP = s(60), s(214), s(294), s(946), s(978)
SLAMS = [s(290), s(326), s(362)]
BEAT = 60 / 120

# ---- the dot's heartbeat in the dark, then the fall
for hb in (24, 36):
    kick(s(hb), 0.5, 0.12)
add(filt(noise, 1500, 6000) * np.clip((t - s(44)) / (IGNITE - s(44)), 0, 1) ** 3 * (t < IGNITE), 0.12)
impact(IGNITE, 1.0)

# ---- pad: four chords, detuned saws, filtered; swells in at the ignition
chords = [[50, 57, 62, 66, 69, 76], [47, 54, 61, 62, 66, 73], [43, 50, 57, 59, 62, 71], [45, 52, 57, 61, 64, 69]]
bar = 4 * BEAT
pa, pb = np.zeros(N), np.zeros(N)
for k in range(int(DUR / (2 * bar)) + 2):
    a, b = k * 2 * bar, (k + 1) * 2 * bar
    win = np.clip((t - a) / 0.6, 0, 1) * np.clip((b + 0.6 - t) / 0.6, 0, 1)
    for j, n in enumerate(chords[k % 4]):
        for d in (-0.08, 0.0, 0.07):
            saw = 2 * ((t * midi(n + d) + rng.uniform()) % 1) - 1
            (pa if j % 2 else pb)[:] += saw * win / 18
swell = np.clip((t - IGNITE) / 2.5, 0, 1) ** 2
kicks = list(np.arange(ZOOM, ORB - 0.4, BEAT))
duck = np.ones(N)
for kt in kicks:
    i = int(kt * SR)
    duck[i:] *= 1 - 0.45 * np.exp(-(np.arange(N - i) / SR) / 0.16)
L += filt(pb, hi=900) * swell * duck * 0.55
R += filt(pa, hi=900) * swell * duck * 0.55
add(filt(pa + pb, hi=300) * swell * duck, 0.22)

# ---- manifesto: the full stops, the iris, the dot flying onto the Z
blip(s(114))
blip(s(174), 88)
whoosh(s(160), 0.6, 0.13, -0.3)
whoosh(LOGO, 0.65, 0.14, 0.3, 800, 7000)
impact(LOGO, 0.55, bells=False)
blip(LOGO + 0.02, 81, 0.08)

# ---- the dive through the Z
zw = np.clip((t - (ZOOM - 1.1)) / 1.1, 0, 1) ** 3 * (t < ZOOM + 0.3) * np.exp(-np.clip(t - ZOOM, 0, None) / 0.12)
add(filt(noise, 300, 9000) * zw, 0.3)

# ---- slams: each punch a hit, the dot blowing up a quick swell before it
for i, at in enumerate(SLAMS):
    kick(at, 1.3, 0.25)
    add(filt(noise, 2000, 12000) * env(at, 0.002, 0.35), 0.13)
    if i:
        whoosh(at, 0.24, 0.2, 0, 800, 9000)

# ---- the beat, with hats off the beat
for i, kt in enumerate(kicks):
    if any(abs(kt - sl) < 0.1 for sl in SLAMS):
        continue
    kick(kt, 0.55 if i % 4 else 0.7)
hats = filt(noise, 7000, 16000)
for kt in np.arange(ZOOM, ORB - 0.6, BEAT):
    add(hats * env(kt + BEAT / 2, 0.001, 0.035, 0.15), 0.09, 0.3)
    if int((kt - ZOOM) / BEAT) % 2:
        add(hats * env(kt + BEAT * 0.75, 0.001, 0.02, 0.08), 0.05, -0.3)

# ---- cuts: through / Z wipes / irises / pulls
for c, pan in [(432, 0.4), (530, -0.4), (566, 0.3), (606, -0.3), (648, 0.4), (766, -0.4), (852, 0.4)]:
    whoosh(s(c), 0.55, 0.16, pan)
for c in (530, 852):
    kick(s(c), 0.8, 0.3)
for c in (566, 606):
    blip(s(c) - 0.05, 83, 0.05)

# ---- the pin's pings, then the riser into the orb
for k in range(4):
    blip(s(880 + k * 14), 93, 0.035)
r = np.clip((t - (POP - 2.2)) / 2.2, 0, 1) ** 2.5 * (t < POP)
add(filt(noise, 900, 9000) * r, 0.15)
for n in (62, 69, 74):
    add(np.sin(2 * np.pi * midi(n) * (1 + 0.5 * r) * t) * r, 0.03)
whoosh(ORB, 0.6, 0.14)
impact(POP, 1.0)
for kt in np.arange(POP + BEAT * 2, DUR - 1.0, BEAT * 2):
    kick(kt, 0.35)

# ---- master
fade = np.clip((DUR - 0.2 - t) / 1.4, 0, 1)
out = np.tanh(np.stack([L, R], 1) * fade[:, None] * 1.1)
out /= np.max(np.abs(out)) / 0.89
with wave.open("public/audio/score.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("ok", round(DUR, 2))
