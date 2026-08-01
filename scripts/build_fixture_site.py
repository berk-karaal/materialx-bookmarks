from pathlib import Path

from mkdocs.commands.build import build
from mkdocs.config import load_config

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "tests" / "fixtures" / "site" / "mkdocs.yml"
OUTPUT = ROOT / ".e2e-site"

build(load_config(str(SOURCE), site_dir=str(OUTPUT)))
