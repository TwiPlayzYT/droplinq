#!/usr/bin/env bash
# Tunnel mode — required for Google/Apple OAuth in Expo Go (avoids LAN IP redirects).
set -euo pipefail
cd "$(dirname "$0")/.."
export EXPO_NO_REDIRECT_PAGE=1
exec npx expo start --tunnel --go "$@"
