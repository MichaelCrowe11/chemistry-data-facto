# Chemistry Data Factory Dashboard

A beautiful web interface for exploring and visualizing chemistry knowledge from the comprehensive Chemistry Data Factory backend.

## Features

- 📊 **Dashboard** - Real-time statistics and database health monitoring
- 🧪 **Compound Search** - Search and browse chemical compounds by name, formula, or SMILES
- ⚡ **Reaction Browser** - Explore chemical reactions with yield filtering
- 📚 **Literature Discovery** - Search scientific papers and patents
- 🎨 **Modern UI** - Clean, professional interface with responsive design

## Prerequisites

This is a frontend interface that connects to the Chemistry Data Factory REST API backend. You need:

1. **Chemistry Data Factory Backend** running at `http://localhost:8000`
   - Follow the setup instructions in the main `chemistry-data-factory` project
   - Start the databases: `docker-compose up -d`
   - Start the API: `uvicorn api.main:app --reload --port 8000`

2. **Node.js** 18+ installed for the frontend

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173`

## Configuration

The app connects to the REST API at `http://localhost:8000/api/v1` by default.

To change this, create a `.env` file:

```env
VITE_API_URL=http://your-api-url:8000/api/v1
```

## Usage

### Dashboard Tab
View real-time statistics about your chemistry database including counts of compounds, reactions, literature, techniques, equipment, and SOPs.

### Compounds Tab
Search for compounds using:
- Common names (e.g., "aspirin", "caffeine")
- Chemical formulas (e.g., "C6H6", "C9H8O4")
- SMILES notation

Results display molecular weight, LogP, CAS numbers, and chemical structures.

### Reactions Tab
Browse chemical reactions and filter by:
- Minimum yield percentage
- Reaction class
- Temperature and pressure conditions

### Literature Tab
Search scientific papers and patents related to chemistry research. View titles, abstracts, authors, and extracted chemistry knowledge.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Vite** - Build tool
- **Lucide React** - Icons

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Integration

The app uses the Chemistry Data Factory REST API with the following endpoints:

- `GET /health` - System health check
- `GET /api/v1/stats` - Database statistics
- `GET /api/v1/compounds` - Search compounds
- `GET /api/v1/reactions` - Search reactions
- `GET /api/v1/literature` - Search literature

See the backend API documentation at `http://localhost:8000/docs` when running.

## Troubleshooting

**"Unable to connect to API"**
- Ensure the Chemistry Data Factory backend is running
- Check that the API is accessible at `http://localhost:8000`
- Verify CORS is enabled in the FastAPI backend

**"No results found"**
- The database may be empty - import data using the backend pipelines
- Try broader search terms
- Check the API logs for errors

**Loading indefinitely**
- Check browser console for errors
- Verify the API endpoint URL is correct
- Ensure all database services are healthy

## License

Part of the Chemistry Data Factory project.
