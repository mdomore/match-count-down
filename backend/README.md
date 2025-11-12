## FastAPI Backend Plan

### Goals
- Replace the NestJS service with a FastAPI application that exposes the same endpoints expected by the frontend.
- Keep a lightweight structure that makes it easy to extend with additional countdown features later.

### Project Layout
- `app/main.py`: FastAPI app instance, startup wiring, and route mounting.
- `app/api/routes.py`: Router definitions (root, health, sports).
- `app/services/sports_service.py`: In-memory sports catalogue mirroring existing logic.
- `app/models/sport.py`: Pydantic model for response validation.
- `requirements.txt`: Runtime dependencies (`fastapi`, `uvicorn`).

### API Surface
- `GET /`: Returns `"Match Count Down API is running!"`.
- `GET /health`: Returns `{ "status": "ok", "timestamp": "<ISO8601>" }`.
- `GET /sports`: Returns the static list of sport configurations.

### Running inside Docker
- Build and start the full stack: `docker compose -f docker-compose.prod.yml up --build`
- Verify the API:
  - `curl http://127.0.0.1:8004/`
  - `curl http://127.0.0.1:8004/health`
  - `curl http://127.0.0.1:8004/sports`
- Stop the stack when finished: `docker compose -f docker-compose.prod.yml down`

