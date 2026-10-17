#!/bin/sh
# Works from any directory; only Python 3 is required.
set -eu
exec python3 "$(dirname "$0")/package.py" "$@"
