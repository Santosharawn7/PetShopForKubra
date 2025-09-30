# Docker Setup for Pet Shop Application

This document explains how to run the Pet Shop application using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd PetShop
   ```

2. **Build and run the application**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

## Services

### Backend (Flask API)
- **Port**: 5000
- **Image**: Built from `./backend/Dockerfile`
- **Database**: SQLite (persisted in `./backend/instance/`)
- **Dependencies**: Python 3.10, Flask, SQLAlchemy, NLTK, etc.

### Frontend (React + Nginx)
- **Port**: 80
- **Image**: Built from `./Dockerfile`
- **Web Server**: Nginx
- **Build Tool**: Vite
- **Dependencies**: React, Axios, React Router, etc.

## Docker Commands

### Build and Start
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Start only specific service
docker-compose up backend
docker-compose up frontend
```

### Stop and Cleanup
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Remove all containers and images
docker-compose down --rmi all
```

### Development
```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in running container
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Rebuild
```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild all services
docker-compose build
```

## Environment Variables

### Backend
- `FLASK_APP`: Set to `app.py`
- `FLASK_ENV`: Set to `production`
- `DATABASE_URL`: SQLite database path

### Frontend
- API calls are proxied to backend via Nginx

## Database Persistence

The SQLite database is persisted in the `./backend/instance/` directory, so data will survive container restarts.

## Troubleshooting

### Port Conflicts
If ports 80 or 5000 are already in use:
```bash
# Check what's using the ports
lsof -i :80
lsof -i :5000

# Kill processes if needed
sudo kill -9 <PID>
```

### Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Database Issues
```bash
# Reset database
docker-compose down -v
rm -rf backend/instance/
docker-compose up --build
```

## Production Considerations

For production deployment:

1. **Use environment-specific configurations**
2. **Set up proper secrets management**
3. **Use a production database (PostgreSQL/MySQL)**
4. **Configure SSL/TLS certificates**
5. **Set up monitoring and logging**
6. **Use Docker secrets for sensitive data**

## File Structure

```
PetShop/
├── docker-compose.yml          # Orchestration
├── Dockerfile                  # Frontend container
├── nginx.conf                  # Nginx configuration
├── .dockerignore              # Frontend build exclusions
├── backend/
│   ├── Dockerfile             # Backend container
│   ├── .dockerignore          # Backend build exclusions
│   ├── app.py                 # Flask application
│   └── requirements.txt       # Python dependencies
└── src/                       # React source code
```



