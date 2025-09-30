# PetShop Application - Setup Guide

## 🚀 Quick Start (Recommended)

### Prerequisites
- **Docker Desktop** installed and running
- **Git** installed
- **Node.js** (v18 or higher) - for development
- **Python** (v3.10 or higher) - for development

### 1. Clone the Repository
```bash
git clone git@github.com:Santosharawn7/PetShopForKubra.git
cd PetShopForKubra
```

### 2. Start the Database
```bash
cd docker/db
./start-db.sh
```

### 3. Start the Application
```bash
# Option A: Docker (Recommended for production)
./docker-start.sh

# Option B: Development mode
# Terminal 1 - Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python app.py

# Terminal 2 - Frontend
npm install
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost (Docker) or http://localhost:5173 (Dev)
- **Backend API**: http://localhost:5000

---

## 🐳 Docker Setup (Production Ready)

### Full Stack with Docker
```bash
# Clone the repository
git clone git@github.com:Santosharawn7/PetShopForKubra.git
cd PetShopForKubra

# Start everything with Docker
./docker-start.sh
```

### Individual Services
```bash
# Start only database
cd docker/db
docker-compose up -d

# Start only frontend
docker-compose up frontend -d

# Start only backend
docker-compose up backend -d
```

### Docker Commands
```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild containers
docker-compose up --build -d

# Remove everything (including data)
docker-compose down -v
```

---

## 💻 Development Setup

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend
python app.py
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Database Setup (Development)
```bash
# Start database container
cd docker/db
./start-db.sh

# Copy database to local directory
docker cp petshop-sqlite:/data/petshop.db ../data/
```

---

## 🗄️ Database Management

### Start Database
```bash
cd docker/db
./start-db.sh
```

### Backup Database
```bash
cd docker/db
./backup-db.sh
```

### Restore Database
```bash
cd docker/db
./restore-db.sh backups/petshop_backup_YYYYMMDD_HHMMSS.db
```

### Access Database
```bash
# Access SQLite database directly
docker exec -it petshop-sqlite sqlite3 /data/petshop.db

# View tables
.tables

# View data
SELECT * FROM product;

# Exit
.quit
```

---

## 🧪 Testing

### Run All Tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend
source venv/bin/activate
python -m pytest test_app.py -v
```

### Test Coverage
```bash
# Frontend coverage
npm run test:coverage

# Backend coverage
cd backend
source venv/bin/activate
python -m pytest --cov=app test_app.py
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```bash
# Backend/.env
DATABASE_URL=sqlite:///./docker/db/data/petshop.db
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
```

### API Configuration
The frontend is configured to connect to `http://localhost:5000` by default. To change this, edit `src/config/api.js`.

---

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Kill process using port 5173
lsof -ti:5173 | xargs kill -9
```

#### Database Connection Issues
```bash
# Check if database container is running
docker ps | grep petshop

# Restart database container
cd docker/db
docker-compose down
docker-compose up -d
```

#### Permission Issues (macOS/Linux)
```bash
# Make scripts executable
chmod +x docker-start.sh
chmod +x docker/db/start-db.sh
chmod +x docker/db/backup-db.sh
chmod +x docker/db/restore-db.sh
```

#### Node Modules Issues
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Python Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf backend/venv
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 📱 Platform-Specific Instructions

### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install git node python docker

# Start Docker Desktop from Applications
```

### Windows
```bash
# Install Git for Windows
# Download from: https://git-scm.com/download/win

# Install Node.js
# Download from: https://nodejs.org/

# Install Python
# Download from: https://www.python.org/downloads/

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
```

### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install dependencies
sudo apt install git nodejs npm python3 python3-pip docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
# Log out and log back in
```

---

## 🔄 Updates and Maintenance

### Pull Latest Changes
```bash
git pull origin main
```

### Update Dependencies
```bash
# Frontend
npm update

# Backend
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Database Migrations
```bash
# The database schema is automatically created
# No manual migrations needed for SQLite
```

---

## 📊 Monitoring and Logs

### View Application Logs
```bash
# Docker logs
docker-compose logs -f

# Backend logs
cd backend
source venv/bin/activate
python app.py

# Frontend logs
npm run dev
```

### Health Checks
```bash
# Check if backend is running
curl http://localhost:5000/api/admin/dashboard

# Check if frontend is running
curl http://localhost:5173

# Check if database is running
docker exec -it petshop-sqlite sqlite3 /data/petshop.db "SELECT 1;"
```

---

## 🆘 Support

### Getting Help
1. **Check the logs** for error messages
2. **Verify all services** are running
3. **Check port availability** (5000, 5173, 5432)
4. **Ensure Docker** is running
5. **Check file permissions** on scripts

### Common Commands Reference
```bash
# Quick status check
docker ps
npm run dev
cd backend && source venv/bin/activate && python app.py

# Full restart
docker-compose down
./docker-start.sh

# Database reset
cd docker/db
docker-compose down -v
./start-db.sh
```

---

## 🎯 Next Steps After Setup

1. **Add Sample Data** - Upload some products through the UI
2. **Test Features** - Try adding items to cart, checkout, etc.
3. **Customize** - Modify the UI, add new features
4. **Deploy** - Use Docker for production deployment
5. **Monitor** - Set up logging and monitoring

---

**Happy coding! 🚀**

*For more detailed information, see the individual documentation files in the project.*



