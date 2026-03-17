#!/bin/bash
# Öffnet die letzte Claude-Code-Session wieder
# Usage: ./_scripts/claude-reopen.sh [session-id]
if [ -n "$1" ]; then
  claude --resume "$1"
else
  claude --resume
fi
