# Genera la música original (sin derechos de terceros) con el sintetizador de la skill video-explicativo.
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / ".claude/skills/video-explicativo/scripts"))
from audio import generate_music
generate_music(40.0, sys.argv[1], mood="calido", bpm=88)
