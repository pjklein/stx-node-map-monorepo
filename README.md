# STX Node Map - Monorepo

A full-stack application for visualizing Stacks (STX) nodes on a map with real-time geolocation data.

## Project Structure

```text
stx-node-map-monorepo/
├── frontend/          # React TypeScript web application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/           # Python Flask API
│   ├── src/
│   ├── run.py
│   ├── requirements.txt
│   └── data.json
│
└── docker-compose.yml # (Optional) For local development
```

## Quick Start

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.6+ (for backend)
- npm or yarn (for frontend)

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
export NETWORK="mainnet"   # Set network environment
python run.py api          # Runs on http://localhost:8089
```

### Frontend Setup

```bash
cd frontend
yarn install
yarn build              # For production
# OR
yarn start              # For development (http://localhost:3000)
```

## Features

- 🗺️ Interactive map view of STX nodes worldwide
- 📊 Real-time statistics and node distribution
- 🔍 Search and filter nodes by IP, country, or city
- 📋 List view with sortable columns
- 🌍 Geolocation data for 500+ nodes
- ♻️ Auto-refresh every 30 seconds
- 📱 Responsive design for all devices

## API Endpoints

### GET /nodes

Returns all nodes with their geolocation data.

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

## Environment Variables

### Backend

- `NETWORK`: Network identifier (e.g., "mainnet", "testnet")

### Frontend

- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:8089`)

## Development

### Running Both Services Locally

**Terminal 1 - Backend:**
```bash
cd backend
source .venv/bin/activate
export NETWORK=mainnet
python run.py api
```

**Terminal 2 - Frontend:**

```bash
cd frontend
yarn start
```

Then visit `http://localhost:3000`

## Technologies

### Frontend Stack

- React 17
- TypeScript
- React Bootstrap
- React Leaflet (maps)
- React CountUp (animations)
- Sass/SCSS

### Backend Stack

- Flask
- Flask-CORS
- Python 3

## License

MIT
