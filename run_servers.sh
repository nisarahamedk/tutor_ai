#!/bin/bash
uvicorn api.main:app --host 0.0.0.0 --port 53211 &
uvicorn api.static_server:app --host 0.0.0.0 --port 55826