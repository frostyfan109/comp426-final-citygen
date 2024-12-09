# Citygen
Interactive city generation and exploration.

This project consists of 3 components:
- React frontend
- FastAPI backend
- PostgreSQL DB

## Backend
### Getting started
For local development, you'll want to have [uv](https://github.com/astral-sh/uv) and [just](https://github.com/casey/just) installed.
However, you can do without `just` and run the commands directly if desired.

You can get started by running
```bash
cd backend
cp .env.docker.sample .env.docker
just run
# or
docker compose run --service-ports application sh -c "sleep 1 && uv run alembic upgrade head && uv run python -m app"
```

#### Running outside Docker
You can run the project on Granian without Docker via `python -m app`.
Alternately, you can run any other Python ASGI webserver (e.g. Uvicorn) against the entrypoint `app.application:application`.

You'll need to setup a Postgres instance yourself and configure your settings accordingly.


### Configuration
Application settings are managed via environment variables. When running through docker-compose,
you'll want to place these environment variables in the `.env.docker` (no configuration is necessary for Postgres).

| Variable                                    | Description                                                            |
| :-------------------------------------      | :--------------------------------------------------------------------- |
| DEV_PHASE                                   | Changes some behaviors to facilitate a smoother development experience |
| APP_PORT                                    | Port to run the application on                                         |
| SECRET_KEY                                  | Arbitrary secret used in authentication                                |
| ACCESS_TOKEN_LIFETIME_SECONDS               | Determines the lifetime of login cookies                               |
| LOG_LEVEL                                   | Application logging level                                              |
| DB_HOST                                     | Hostname of the database server                                        |
| DB_PORT                                     | Port of the database server                                            |
| DB_USER                                     | Username for authenticating to the database                            |
| DB_PASSWORD                                 | Password for authenticating to the database                            |
| DB_DATABASE                                 | Database name to use within the server                                 |

For the exhaustive settings list and defaults, please refer to app/settings.py.

### Building
You can build a production image of the API using Docker.

## Webapp
### Geting started
For local development, you can get started by running
```bash
cd webapp
cp .env.sample .env
set -a && source .env
npm install
npm start
```
You'll need to have the backend running beforehand. You can point the UI to its location
via your .env or setting `REACT_APP_API_URL`.

NOTE: CORS is enabled on localhost:3000 when running the API in development mode,
so you should either run the UI on port 3000 or disable CORS in your browser.

### Building
```bash
set -a && source .env
npm build
```
This will output the production bundle of the webapp under `build`.