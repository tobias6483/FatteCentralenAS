#!/bin/bash

# Find scriptets egen mappe for at lave stier relative til den
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
VENV_PATH="$SCRIPT_DIR/.venv" # Brug absolut sti for en sikkerheds skyld

# Tjek om det virtuelle miljø eksisterer
if [ ! -d "$VENV_PATH" ]; then
  echo "❌ Fejl: Virtuelt miljø '$VENV_PATH' ikke fundet."
  echo "👉 Kør venligst kommandoerne for at oprette det først:"
  echo "   1. [VÆLG PYTHON] python3.12 -m venv .venv  # Erstat python3.12 med din ønskede version"
  echo "   2. source .venv/bin/activate"
  echo "   3. pip install -r requirements.txt"
  exit 1 # Afslut scriptet hvis venv mangler
fi

# Aktiver det virtuelle miljø
echo "🐍 Aktiverer virtuelt miljø: $VENV_PATH"
source "$VENV_PATH/bin/activate"

# Add the monorepo subdirectory to PYTHONPATH so Python can find the 'apps' package
export PYTHONPATH="$SCRIPT_DIR/fattecentralen-monorepo:$PYTHONPATH"
echo "   PYTHONPATH = $PYTHONPATH"

# Sæt Flask environment variabler (alternativt: brug en .flaskenv fil)
# Sørg for at run:app passer med din run.py fil (eller hvis du har create_app i run.py)
export FLASK_APP="run:app" # This should now work as run.py can find apps.backend
# Sæt til 'development' for at aktivere debug og auto-reload
export FLASK_ENV="development"
# Vis hvilke indstillinger der bruges
echo "   FLASK_APP = $FLASK_APP"
echo "   FLASK_ENV = $FLASK_ENV"


# Start Redis-server er fjernet herfra.
# Sørg for, at Redis kører som en baggrundstjeneste, hvis din applikation kræver det.
# echo "ℹ️ Note: Ensuring Redis is running externally if needed..."

echo "🚀 Starter Flask development server..."
# Kør Flask med host 0.0.0.0 (tilgængelig på netværket) og port 5000
# Alternativt: flask run --host=0.0.0.0 --port=5001
# Brug den specifikke python fra venv for at undgå problemer med pyenv shims
"$VENV_PATH/bin/python" "$SCRIPT_DIR/run.py"

echo "Flask server stoppet."

# Deaktivering sker typisk automatisk, når scriptet eller shell'en lukker
# deactivate
