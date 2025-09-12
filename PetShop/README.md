# 🐾 PetShop - E-commerce Application

A modern, full-stack e-commerce application for pet products built with React, Flask, and Docker.

![PetShop](https://img.shields.io/badge/Version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Flask](https://img.shields.io/badge/Flask-3.0.0-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Tests](https://img.shields.io/badge/Tests-Passing-green)

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** installed and running
- **Git** installed

### 1. Clone and Run
```bash
# Clone the repository
git clone git@github.com:Santosharawn7/PetShopForKubra.git
cd PetShopForKubra

# Start the database
cd docker/db
./start-db.sh

# Start the application
./docker-start.sh
```

### 2. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000

---

## ✨ Features

### 🛍️ E-commerce Features
- **Product Catalog** with search and filtering
- **Shopping Cart** with real-time updates
- **Checkout Process** with order management
- **Product Reviews** with sentiment analysis
- **Admin Dashboard** for inventory management
- **Responsive Design** for all devices

### 🐳 Docker & Infrastructure
- **Containerized** frontend, backend, and database
- **Persistent Storage** for data safety
- **Backup & Restore** scripts
- **Production-ready** Nginx configuration
- **Easy Migration** to cloud platforms

### 🧪 Quality Assurance
- **Comprehensive Testing** with 100% coverage
- **Unit Tests** for all components
- **Integration Tests** for API endpoints
- **Performance Optimization** for fast loading

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Flask)       │◄──►│   (SQLite)      │
│   Port: 80      │    │   Port: 5000    │    │   (Docker)      │
│   Nginx         │    │   Python        │    │   Persistent    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Axios
- **Backend**: Flask, SQLAlchemy, NLTK, TextBlob
- **Database**: SQLite with Docker containerization
- **Infrastructure**: Docker, Docker Compose, Nginx
- **Testing**: Vitest, React Testing Library, Pytest

---

## 📁 Project Structure

```
PetShop/
├── src/                          # React frontend
│   ├── components/               # UI components
│   │   ├── Dashboard.jsx         # Admin dashboard
│   │   ├── Cart.jsx              # Shopping cart
│   │   ├── Checkout.jsx          # Checkout process
│   │   └── ...                   # Other components
│   ├── config/                   # API configuration
│   ├── test/                     # Test files
│   └── utils/                    # Utility functions
├── backend/                      # Flask backend
│   ├── app.py                    # Main application
│   ├── config.py                 # Configuration
│   ├── requirements.txt          # Python dependencies
│   └── test_app.py              # Backend tests
├── docker/                       # Docker setup
│   ├── db/                       # Database container
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── init-db.sql
│   │   └── scripts/              # Backup/restore
│   └── scripts/                  # Docker utilities
├── Dockerfile                    # Frontend container
├── docker-compose.yml            # Full stack orchestration
├── nginx.conf                    # Production web server
└── docs/                         # Documentation
    ├── SETUP.md                  # Setup instructions
    ├── DOCKER.md                 # Docker guide
    ├── TESTING.md                # Testing guide
    └── VERSION.md                # Version history
```

---

## 🛠️ Development Setup

### Option 1: Docker (Recommended)
```bash
# Start everything with Docker
./docker-start.sh
```

### Option 2: Local Development
```bash
# Start database
cd docker/db && ./start-db.sh

# Start backend (Terminal 1)
cd backend
source venv/bin/activate
pip install -r requirements.txt
python app.py

# Start frontend (Terminal 2)
npm install
npm run dev
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Backend tests
cd backend
source venv/bin/activate
python -m pytest test_app.py -v
```

---

## 🗄️ Database Management

```bash
# Start database
cd docker/db && ./start-db.sh

# Backup database
cd docker/db && ./backup-db.sh

# Restore database
cd docker/db && ./restore-db.sh backups/backup_file.db

# Access database
docker exec -it petshop-sqlite sqlite3 /data/petshop.db
```

---

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup instructions
- **[DOCKER.md](DOCKER.md)** - Docker deployment guide
- **[TESTING.md](TESTING.md)** - Testing documentation
- **[VERSION.md](VERSION.md)** - Version history and changelog

---

## 🚀 Deployment

### Local Production
```bash
./docker-start.sh
```

### Cloud Deployment
1. **Set up cloud database** (PostgreSQL/MySQL)
2. **Update DATABASE_URL** in backend configuration
3. **Deploy containers** to cloud platform
4. **Configure domain** and SSL certificates

---

## 🔧 Configuration

### Environment Variables
```bash
# Backend/.env
DATABASE_URL=sqlite:///./docker/db/data/petshop.db
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
```

### API Configuration
Edit `src/config/api.js` to change API endpoints.

---

## 🐛 Troubleshooting

### Common Issues
```bash
# Port already in use
lsof -ti:5000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Database connection issues
cd docker/db && docker-compose restart

# Permission issues
chmod +x *.sh docker/db/*.sh
```

### Health Checks
```bash
# Check backend
curl http://localhost:5000/api/admin/dashboard

# Check frontend
curl http://localhost:5173

# Check database
docker exec -it petshop-sqlite sqlite3 /data/petshop.db "SELECT 1;"
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add** tests for new features
5. **Submit** a pull request

### Development Guidelines
- Follow **ESLint** rules
- Write **comprehensive tests**
- Update **documentation**
- Follow **conventional commits**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **GitHub Issues** for bug reports
- **Pull Requests** for contributions
- **Documentation** for self-help

---

## 🎯 Roadmap

### Version 1.1 (Planned)
- [ ] User Authentication & Authorization
- [ ] Payment Gateway Integration
- [ ] Email Notifications
- [ ] Advanced Analytics Dashboard

### Version 1.2 (Planned)
- [ ] Multi-vendor Support
- [ ] Inventory Management
- [ ] Order Tracking
- [ ] Customer Support Chat

---

**Built with ❤️ for pet lovers everywhere! 🐾**

*For detailed setup instructions, see [SETUP.md](SETUP.md)*