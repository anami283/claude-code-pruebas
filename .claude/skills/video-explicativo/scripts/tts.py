"""Proveedores de voz. Cada uno devuelve un WAV mono 48 kHz por frase (con caché por hash).

Orden en modo auto: ElevenLabs (si hay ELEVENLABS_API_KEY y red) -> Piper (offline) -> silencio (duración estimada).
"""
import hashlib, json, os, re, subprocess, tarfile, urllib.request
from pathlib import Path

CACHE = Path(os.environ.get("VIDEO_EXPLICATIVO_CACHE", Path.home() / ".cache" / "video-explicativo"))
SR = 48000

# Voces ElevenLabs sugeridas para español (el usuario puede pasar cualquier voice_id propio / clonado).
EL_DEFAULT_VOICE = os.environ.get("ELEVENLABS_VOICE_ID", "")
EL_MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")

PIPER_VOICES = {
    # nombre: (url_onnx_huggingface, url_json_huggingface)
    "es_MX-claude-high": ("https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/claude/high/es_MX-claude-high.onnx", None),
    "es_ES-davefx-medium": ("https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx", None),
    "es_MX-ald-medium": ("https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_MX/ald/medium/es_MX-ald-medium.onnx", None),
}
# Respaldo alojado en GitHub (calidad baja, pero siempre disponible)
PIPER_GH_FALLBACK = ("es-mls_10246-low", "https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-es-mls_10246-low.tar.gz")


def normalize(text):
    t = re.sub(r"\s+", " ", str(text)).strip()
    return t


def estimate(text):
    # ~15 caracteres/segundo en español narrado a ritmo de explicador
    return max(0.8, len(text) / 15.0)


def to_wav48(src, dst):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-ac", "1", "-ar", str(SR),
                    "-af", "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse",
                    str(dst)], check=True)
    return dst


def _key(*parts):
    return hashlib.sha1("|".join(map(str, parts)).encode()).hexdigest()[:16]


class Silent:
    def describe(self):
        return "sin voz (duraciones estimadas; sólo subtítulos)"

    def synth(self, text, outdir, i, prev, nxt):
        return None


class Dir:
    def __init__(self, path):
        self.path = Path(path)

    def describe(self):
        return f"audios pregrabados en {self.path}"

    def synth(self, text, outdir, i, prev, nxt):
        for ext in ("wav", "mp3", "m4a", "ogg"):
            p = self.path / f"beat_{i:03d}.{ext}"
            if p.exists():
                return to_wav48(p, Path(outdir) / f"beat_{i:03d}.wav")
        raise SystemExit(f"Falta el audio {self.path}/beat_{i:03d}.(wav|mp3) para: {text}")


class ElevenLabs:
    def __init__(self, voice, settings):
        self.key = os.environ.get("ELEVENLABS_API_KEY")
        self.voice = voice or settings.get("elevenlabs_voice_id") or EL_DEFAULT_VOICE
        self.model = settings.get("model", EL_MODEL)
        self.vs = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True, "speed": settings.get("speed", 1.0)}

    @staticmethod
    def available():
        if not os.environ.get("ELEVENLABS_API_KEY"):
            return False
        try:
            req = urllib.request.Request("https://api.elevenlabs.io/v1/models", headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]})
            urllib.request.urlopen(req, timeout=8)
            return True
        except Exception:
            return False

    def describe(self):
        return f"ElevenLabs ({self.model}, voz {self.voice})"

    def synth(self, text, outdir, i, prev, nxt):
        if not self.voice:
            raise SystemExit("Falta el voice_id de ElevenLabs: usa --voice <id> o meta.voice.elevenlabs_voice_id")
        k = _key("el", self.voice, self.model, json.dumps(self.vs, sort_keys=True), text, prev, nxt)
        cached = CACHE / "el" / f"{k}.mp3"
        if not cached.exists():
            cached.parent.mkdir(parents=True, exist_ok=True)
            body = json.dumps({"text": text, "model_id": self.model, "voice_settings": self.vs,
                               "previous_text": prev or None, "next_text": nxt or None, "language_code": "es"}).encode()
            req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice}?output_format=mp3_44100_128",
                                         data=body, headers={"xi-api-key": self.key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
            try:
                with urllib.request.urlopen(req, timeout=120) as r:
                    cached.write_bytes(r.read())
            except urllib.error.HTTPError as e:
                if e.code == 400 and "language_code" in (msg := e.read().decode(errors="ignore")):
                    body2 = json.loads(body); body2.pop("language_code")
                    req = urllib.request.Request(req.full_url, data=json.dumps(body2).encode(), headers=dict(req.headers))
                    with urllib.request.urlopen(req, timeout=120) as r:
                        cached.write_bytes(r.read())
                else:
                    raise
        return to_wav48(cached, Path(outdir) / f"beat_{i:03d}.wav")


class Piper:
    def __init__(self, voice, settings):
        self.voice_name = voice or settings.get("piper_voice") or "es_MX-claude-high"
        self.length_scale = settings.get("piper_length_scale", 0.95)
        self.model = None

    def describe(self):
        return f"Piper offline ({self.model.name if self.model else self.voice_name})"

    def _ensure(self):
        if self.model:
            return
        try:
            import piper  # noqa: F401
        except ImportError:
            subprocess.run(["pip", "install", "-q", "piper-tts"], check=True)
        d = CACHE / "piper"; d.mkdir(parents=True, exist_ok=True)
        onnx = d / f"{self.voice_name}.onnx"
        if not onnx.exists() and self.voice_name in PIPER_VOICES:
            url = PIPER_VOICES[self.voice_name][0]
            try:
                urllib.request.urlretrieve(url, onnx)
                urllib.request.urlretrieve(url + ".json", str(onnx) + ".json")
            except Exception:
                onnx.unlink(missing_ok=True)
        if not onnx.exists():
            name, url = PIPER_GH_FALLBACK
            onnx = d / f"{name}.onnx"
            if not onnx.exists():
                tgz = d / "fallback.tar.gz"
                urllib.request.urlretrieve(url, tgz)
                with tarfile.open(tgz) as tf:
                    for m in tf.getmembers():
                        if m.name.endswith(".onnx") or m.name.endswith(".onnx.json"):
                            m.name = f"{name}.onnx" + (".json" if m.name.endswith(".json") else "")
                            tf.extract(m, d)
                tgz.unlink()
        self.model = onnx

    def synth(self, text, outdir, i, prev, nxt):
        self._ensure()
        k = _key("piper", self.model.name, self.length_scale, text)
        cached = CACHE / "piper_out" / f"{k}.wav"
        if not cached.exists():
            cached.parent.mkdir(parents=True, exist_ok=True)
            code = (
                "import sys,wave\nfrom piper import PiperVoice\n"
                "try:\n from piper import SynthesisConfig\n cfg=SynthesisConfig(length_scale=float(sys.argv[3]))\nexcept Exception:\n cfg=None\n"
                "v=PiperVoice.load(sys.argv[1])\n"
                "with wave.open(sys.argv[2],'wb') as wf:\n"
                " t=sys.stdin.read()\n"
                " v.synthesize_wav(t,wf,syn_config=cfg) if cfg else v.synthesize_wav(t,wf)\n"
            )
            subprocess.run(["python3", "-c", code, str(self.model), str(cached), str(self.length_scale)], input=text, text=True, check=True, capture_output=True)
        return to_wav48(cached, Path(outdir) / f"beat_{i:03d}.wav")


def pick(mode, settings, voice):
    settings = settings or {}
    if mode.startswith("dir:"):
        return Dir(mode[4:])
    if mode == "none":
        return Silent()
    if mode == "elevenlabs":
        return ElevenLabs(voice, settings)
    if mode == "piper":
        return Piper(voice, settings)
    # auto
    if ElevenLabs.available() and (voice or settings.get("elevenlabs_voice_id") or EL_DEFAULT_VOICE):
        return ElevenLabs(voice, settings)
    try:
        p = Piper(None, settings); p._ensure(); return p
    except Exception as e:
        print(f"  (Piper no disponible: {e}); se usará modo silencioso")
        return Silent()
