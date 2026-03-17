#!/bin/bash
# Screenshot-Tool: Macht einen Screenshot und speichert ihn als output.png
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/output.png"
screencapture -x "$OUTPUT"
echo "Screenshot gespeichert: $OUTPUT"
