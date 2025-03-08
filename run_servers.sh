#!/bin/bash
uvicorn api.main:app --host 0.0.0.0 --port 54427 &
uvicorn api.static_server:app --host 0.0.0.0 --port 55251