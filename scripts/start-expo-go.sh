#!/usr/bin/env bash
# Always launch Metro for Expo Go on the local network with the short exp:// QR.
# Usage: npm start    or    npm run start:clear
set -euo pipefail
cd "$(dirname "$0")/.."
export EXPO_NO_REDIRECT_PAGE=1
exec npx expo start --lan --go "$@"
