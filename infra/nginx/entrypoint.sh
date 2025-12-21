#!/bin/sh
set -eu

CERT_DIR="/etc/nginx/certs"
CERT_CRT="${CERT_DIR}/tls.crt"
CERT_KEY="${CERT_DIR}/tls.key"

mkdir -p "${CERT_DIR}"

if [ ! -f "${CERT_CRT}" ] || [ ! -f "${CERT_KEY}" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -subj "/C=BR/ST=SP/L=SP/O=Nexa/CN=localhost" \
    -keyout "${CERT_KEY}" \
    -out "${CERT_CRT}"
fi

exec nginx -g "daemon off;"
