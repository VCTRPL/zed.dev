"""Synthesizes the soundtrack for the promo, cut to the video's timeline.

Ambient pad + soft pulse, a riser into the logo, an impact when the orange dot
lands, whooshes on every transition and a final hit on the orb click.
Run: python3 score.py  ->  public/audio/score.wav
"""
import wave
import numpy as np

SR = 44100
FPS = 30
DUR = 1250 / FPS + 0.3
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)


def sec(frame):
    return frame / FPS


def lowpass(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / hi) ** 4) * (1 - 1 / np.sqrt(1 + (f / lo) ** 4))
    return np.fft.irfft(X, len(x))


def env(start, attack, release, length=None):
    """0..1 envelope: linear attack, exponential release."""
    e = np.zeros(N)
    i0 = int(start * SR)
    a = max(1, int(attack * SR))
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


BEAT = 60 / 120
DROP = sec(140)          # the orange dot lands
PULL = sec(964)          # the beat drops out before the CTA
CLICK = sec(1062)        # the orb click
END = sec(1128)          # the orb lands as the profile picture
ZOOM = sec(214)          # the camera passes through the Z

# ---- pad: four chords, detuned saws, softly filtered
chords = [[50, 57, 62, 66, 69, 76], [47, 54, 61, 62, 66, 73], [43, 50, 57, 59, 62, 71], [45, 52, 57, 61, 64, 69]]
bar = 4 * BEAT
pad = np.zeros(N)
padL = np.zeros(N)
for k in range(int(DUR / (2 * bar)) + 2):
    ch = chords[k % 4]
    a, b = k * 2 * bar, (k + 1) * 2 * bar
    win = np.clip((t - a) / 0.6, 0, 1) * np.clip((b + 0.6 - t) / 0.6, 0, 1)
    for j, n in enumerate(ch):
        for d in (-0.08, 0.0, 0.07):
            fr = midi(n + d)
            ph = rng.uniform(0, 1)
            saw = 2 * ((t * fr + ph) % 1) - 1
            (pad if j % 2 else padL)[:] += saw * win / (len(ch) * 3)
swell = np.clip(t / 3.0, 0, 1) ** 2
lfo = 0.5 + 0.5 * np.sin(2 * np.pi * t / 7)
padA = lowpass(pad, 900) * swell
padB = lowpass(padL, 900) * swell
# the pad ducks on each kick for a gentle pump
kick_times = np.arange(DROP, PULL, BEAT)
duck = np.ones(N)
for kt in kick_times:
    i = int(kt * SR)
    seg = np.arange(N - i) / SR
    duck[i:] *= 1 - 0.45 * np.exp(-seg / 0.16)
for kt in np.arange(CLICK, DUR, BEAT):
    i = int(kt * SR)
    seg = np.arange(N - i) / SR
    duck[i:] *= 1 - 0.35 * np.exp(-seg / 0.18)
L += padB * 0.55 * duck * (0.85 + 0.15 * lfo)
R += padA * 0.55 * duck * (0.85 + 0.15 * (1 - lfo))
add(lowpass(pad + padL, 300) * swell * duck, 0.25)

# ---- sub drone under the intro
drone = np.sin(2 * np.pi * midi(38) * t) * np.clip(t / 2.5, 0, 1) * np.clip((DROP + 0.2 - t) / 0.4, 0, 1)
add(drone, 0.22)

# ---- riser into the logo
noise = rng.standard_normal(N)
r_env = np.clip((t - 0.3) / (DROP - 0.3), 0, 1) ** 3 * (t < DROP)
riser = bandpass(noise, 1500, 7000) * r_env
add(riser, 0.12, -0.2)
add(bandpass(noise[::-1].copy(), 1200, 6000) * r_env, 0.12, 0.2)


def kick(at, gain=1.0):
    seg_n = int(0.5 * SR)
    i = int(at * SR)
    if i >= N:
        return
    s = np.arange(min(seg_n, N - i)) / SR
    f = 46 + 110 * np.exp(-s / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    k = np.sin(ph) * np.exp(-s / 0.22) + 0.25 * np.tanh(3 * np.sin(ph)) * np.exp(-s / 0.05)
    L[i:i + len(s)] += k * gain * 0.6
    R[i:i + len(s)] += k * gain * 0.6


def impact(at, gain=1.0):
    kick(at, 1.6 * gain)
    boom = np.sin(2 * np.pi * 36 * t) * env(at, 0.005, 1.4)
    add(boom, 0.45 * gain)
    crash = bandpass(noise, 2500, 14000) * env(at, 0.002, 0.9)
    add(crash, 0.18 * gain)
    # shimmer: bell partials of the D chord
    for n, p in [(74, -0.5), (78, 0.4), (81, -0.2), (86, 0.3), (90, 0.0)]:
        bell = np.sin(2 * np.pi * midi(n) * t) * env(at + 0.01, 0.004, 1.6)
        add(bell, 0.05 * gain, p)


impact(DROP)
impact(CLICK, 0.55)
impact(END, 1.0)
# the dive through the Z: a long rising whoosh and a soft hit on the far side
zw = np.clip((t - (ZOOM - 1.1)) / 1.1, 0, 1) ** 3 * (t < ZOOM + 0.3) * np.exp(-np.clip(t - ZOOM, 0, None) / 0.12)
add(bandpass(noise, 300, 9000) * zw, 0.32)
kick(ZOOM, 1.1)
add(bandpass(noise, 3000, 14000) * env(ZOOM, 0.002, 0.5), 0.1)
# the riser into the avatar
r3 = np.clip((t - (END - 1.6)) / 1.6, 0, 1) ** 2.5 * (t < END)
add(bandpass(noise, 800, 8000) * r3, 0.16)

# ---- the pulse: soft kick on the beat, hats off the beat in the projects part
for i, kt in enumerate(kick_times):
    kick(kt, 0.55 if i % 4 else 0.7)
hat_src = bandpass(noise, 7000, 16000)
for kt in np.arange(sec(345), PULL, BEAT):
    h = hat_src * env(kt + BEAT / 2, 0.001, 0.035, 0.15)
    add(h, 0.09, 0.3)
    if int((kt - sec(345)) / BEAT) % 2:
        add(hat_src * env(kt + BEAT * 0.75, 0.001, 0.02, 0.08), 0.05, -0.3)
for kt in np.arange(END, DUR - 1.2, BEAT):
    kick(kt, 0.4)

# ---- whooshes into each cut
cuts = [345, 456, 560, 666, 800, 916, 986]
for c in cuts:
    end = sec(c) + 0.12
    start = end - 0.55
    w = np.clip((t - start) / 0.55, 0, 1) ** 2 * (t < end + 0.25) * np.exp(-np.clip(t - end, 0, None) / 0.08)
    sweep = bandpass(noise, 400, 5000) * w
    add(sweep, 0.16, 0.4 if c % 2 else -0.4)

# ---- riser into the CTA
r2 = np.clip((t - (CLICK - 2.4)) / 2.4, 0, 1) ** 2.5 * (t < CLICK)
add(bandpass(noise, 1000, 9000) * r2, 0.14)
for n in (62, 69, 74):
    add(np.sin(2 * np.pi * midi(n) * (1 + 0.5 * r2) * t) * r2, 0.03)

# ---- ticks when the stack icons pop in
for k in range(12):
    at = sec(914 + (k % 6) * 4)
    add(np.sin(2 * np.pi * 2600 * t) * env(at, 0.001, 0.02, 0.06), 0.03, (k % 3 - 1) * 0.5)

# ---- master: fade, soft clip, normalize
fade = np.clip((DUR - 0.5 - t) / 1.2, 0, 1)
out = np.stack([L, R], 1) * fade[:, None]
out = np.tanh(out * 1.1)
out /= np.max(np.abs(out)) / 0.89
with wave.open("public/audio/score.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("ok", DUR)
