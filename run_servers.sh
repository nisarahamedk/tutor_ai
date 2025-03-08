#!/bin/bash
source .env
uvicorn api.main:app --host 0.0.0.0 --port ${API_PORT:-54427} &
uvicorn api.static_server:app --host 0.0.0.0 --port ${STATIC_PORT:-55251}