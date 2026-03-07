# Deployment Guide

Instructions for deploying The Green Felt using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

No other dependencies are needed — Docker handles Node.js, pnpm, MongoDB, and nginx.

## Quick Start

From the project root:

```bash
cd deploy
docker compose up --build
```

This starts three containers:

| Container | Service | Port | Description |
|-----------|---------|------|-------------|
| `tgf-mongodb` | MongoDB 7 | `27017` | Game state database |
| `tgf-server` | Node.js (Fastify) | `3001` | API + WebSocket server |
| `tgf-client` | nginx | `3000` | React SPA + reverse proxy |

Open `http://localhost:3000` once all containers are healthy.

## Architecture

```
Browser :3000 ──► nginx (client container)
                    ├── static files (React SPA)
                    ├── /api/*  ──► server:3001
                    └── /trpc/* ──► server:3001 (WebSocket)

server:3001 ──► mongodb:27017
```

nginx serves the built React app and proxies `/api/` and `/trpc/` requests to the server container. The server connects to MongoDB using Docker's internal networking.

## Configuration

### Environment Variables

The server container accepts these environment variables, configured in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `mongodb://mongodb:27017/the-green-felt` | MongoDB connection string |
| `PORT` | `3001` | Server listen port |

To override, edit the `environment` section in `docker-compose.yml` or create a `.env` file in the `deploy/` directory:

```env
DATABASE_URL=mongodb://mongodb:27017/the-green-felt
PORT=3001
```

### MongoDB Authentication

The default setup runs MongoDB **without authentication** for simplicity. To enable auth for production:

1. Add credentials to `docker-compose.yml`:

```yaml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: your-secure-password
    MONGO_INITDB_DATABASE: the-green-felt
```

2. Update the `DATABASE_URL` on the server:

```yaml
server:
  environment:
    DATABASE_URL: mongodb://admin:your-secure-password@mongodb:27017/the-green-felt?authSource=admin
```

3. Delete the existing volume and rebuild:

```bash
docker compose down -v
docker compose up --build
```

## Common Operations

### Start in the background

```bash
docker compose up --build -d
```

### View logs

```bash
docker compose logs -f          # all services
docker compose logs -f server   # server only
docker compose logs -f mongodb  # database only
```

### Stop containers (keep data)

```bash
docker compose down
```

### Stop containers and delete all data

```bash
docker compose down -v
```

### Rebuild a single service

```bash
docker compose up --build server   # rebuild only the server
docker compose up --build client   # rebuild only the client
```

### Access MongoDB shell

```bash
docker exec -it tgf-mongodb mongosh the-green-felt
```

### Check container health

```bash
docker compose ps
```

## Updating

After pulling new code:

```bash
cd deploy
docker compose up --build
```

Docker layer caching means unchanged layers are reused — only modified packages are rebuilt.

## Troubleshooting

### Containers won't start

Check if the ports are already in use:

```bash
# Linux / macOS / WSL
ss -tlnp | grep -E '3000|3001|27017'

# Windows
netstat -ano | findstr "3000 3001 27017"
```

Free the ports or change them in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"     # change client from 3000 to 8080
  - "4000:3001"   # change server from 3001 to 4000
```

### Server can't connect to MongoDB

The server waits for MongoDB's healthcheck before starting. If it still fails:

```bash
docker compose logs mongodb     # check if MongoDB started
docker compose restart server   # retry the connection
```

### Client shows a blank page

Check if the build completed successfully:

```bash
docker compose logs client
```

If there are build errors, fix the source and rebuild:

```bash
docker compose up --build client
```

### Reset everything

```bash
docker compose down -v --rmi local
docker compose up --build
```

This removes all containers, volumes, and locally built images, then starts fresh.

## Production Considerations

For a public deployment, you should also:

- Enable MongoDB authentication (see above)
- Add HTTPS via a reverse proxy (e.g., Caddy, Traefik) or a cloud load balancer
- Set `NODE_ENV=production` on the server container
- Add rate limiting to the nginx config
- Set up database backups (e.g., `mongodump` on a cron schedule)
- Use Docker secrets or a vault for sensitive environment variables
