#!/bin/sh
# Works from any directory; requires Node.js, Python 3 and Pillow for validation.
set -eu
exec python3 "$(dirname "$0")/package.py" "$@"
