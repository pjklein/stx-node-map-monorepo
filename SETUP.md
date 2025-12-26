# STX Node Map - Complete Setup Guide

## 🎯 What You Have

A fully functional monorepo with:
- **Frontend**: React 17 TypeScript web app (port 3000)
- **Backend**: Python Flask API (port 8089)
- Both configured to work together seamlessly

## 📁 Project Structure

```
stx-node-map-monorepo/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── navbar/      # Navigation bar with network display
│   │   │   ├── info-card/   # Statistics dashboard
│   │   │   ├── map/         # Interactive Leaflet map
│   │   │   └── node-list/   # Searchable node list
│   │   ├── App.tsx          # Main app with state management
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── config.ts        # API configuration
│   │   └── style.scss       # Global styles
│   ├── package.json
│   └── build/               # Production build output
│
├── backend/                  # Flask API server
│   ├── src/
│   │   └── stx_node_map/
│   │       ├── api/         # Flask app and routes
│   │       └── util/        # Utilities
│   ├── data.json            # Node data (200+ nodes with geo)
│   ├── run.py               # Entry point
│   └── requirements.txt      # Python dependencies
│
├── package.json             # Monorepo root config
├── README.md                # This file
├── GIT_SETUP.md             # Git fork configuration
└── .nvmrc                   # Node version (18)
```

## 🚀 Quick Start (Development)

### Terminal 1 - Start Backend

```bash
cd /home/red/stx-node-map-monorepo/backend

# Set up Python environment (first time only)
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set network and run API
export NETWORK=mainnet
python run.py api

# Server runs on http://localhost:8089
```

### Terminal 2 - Start Frontend

```bash
cd /home/red/stx-node-map-monorepo/frontend

# Install dependencies (first time only)
yarn install

# Start development server
yarn start

# App opens on http://localhost:3000
```

### That's it! 🎉

Visit `http://localhost:3000` and you'll see:
- Interactive map of 200+ Stacks nodes worldwide
- Statistics dashboard (total nodes, geo-located %, countries)
- Search/filter nodes by IP, country, city
- Toggle between Map and List views
- Click markers on map to see node details

## 📦 Build for Production

```bash
cd frontend
yarn build
# Output: frontend/build/

# Serve with:
yarn global add serve
serve -s build
```

## 🔧 Features

### Frontend
✅ Interactive Leaflet map with 200+ nodes
✅ Real-time statistics (CountUp animations)
✅ Search/filter by IP, country, city
✅ List view with sortable data
✅ Map/List view toggle
✅ Auto-refresh every 30 seconds
✅ Responsive Bootstrap design
✅ Error handling and loading states

### Backend
✅ Flask REST API (`/nodes` endpoint)
✅ CORS enabled for local development
✅ JSON data with geolocation for nodes
✅ Easy to add more endpoints

## 🐙 Git Setup (GitHub Forks)

Your repositories are forked under `pjklein`:

**Frontend:**
- Your Fork: `https://github.com/pjklein/stx-node-map`
- Original: `https://github.com/talhasch/stx-node-map`
- Remote: `origin` → your fork, `upstream` → original

**Backend:**
- Your Fork: `https://github.com/pjklein/stx-node-map-backend`
- Original: `https://github.com/talhasch/stx-node-map-backend`
- Remote: `origin` → your fork, `upstream` → original

### Push Changes

```bash
cd frontend  # or backend
git add .
git commit -m "Your changes"
git push origin develop
```

### Sync with Original

```bash
git fetch upstream
git rebase upstream/develop
git push origin develop
```

## 🌐 Environment Variables

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:8089
```

### Backend (`backend/.env`)
```
NETWORK=mainnet
```

## 📡 API Endpoints

### `GET /nodes`

Returns all nodes with geolocation data.

**Response:**
```json
{
  "network": "mainnet",
  "nodes": [
    {
      "address": "185.119.118.68",
      "location": {
        "lat": 34.498624,
        "lng": -106.108278,
        "country": "United States",
        "city": "Ashburn"
      }
    },
    ...
  ]
}
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 17, TypeScript, React Bootstrap, React Leaflet, SCSS |
| Backend | Flask, Python 3, Flask-CORS, JSON |
| Map | OpenStreetMap (via Leaflet) |
| Build | Create React App, Webpack 5 |
| Package Manager | Yarn (frontend), pip (backend) |
| Node Version | 18+ |

## 📝 Next Steps

1. **Backend Extensions**
   - Add WebSocket for real-time updates
   - Add database for node persistence
   - Add node status monitoring

2. **Frontend Enhancements**
   - Export nodes as CSV/GeoJSON
   - Node statistics over time
   - Alerts for node status changes
   - Dark mode

3. **DevOps**
   - Docker/Docker-Compose setup
   - CI/CD pipeline (GitHub Actions)
   - Kubernetes deployment

## ❓ Troubleshooting

### Frontend won't connect to backend
```bash
# Check backend is running on :8089
curl http://localhost:8089/nodes

# Check frontend API config
cat frontend/src/config.ts
# Should have: api: "http://localhost:8089"
```

### Build fails with engine error
```bash
# Update Node if needed
nvm install 18
nvm use 18
```

### Backend data not loading
```bash
# Check data.json exists
ls -lh backend/data.json

# Verify network env var
echo $NETWORK
```

## 📚 Resources

- [React Leaflet Docs](https://react-leaflet.js.org/)
- [Flask Docs](https://flask.palletsprojects.com/)
- [Stacks Documentation](https://docs.stacks.co/)
- [OpenStreetMap](https://www.openstreetmap.org/)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make changes to your fork
3. Commit: `git commit -m "Add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open a pull request to the original repo

---

**Happy coding! 🎉**
