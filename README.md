# ServerKit Redis Manager

A powerful Redis management extension for ServerKit. Monitor, browse, and manage your Redis server directly from the panel.

## Features

- **Real-time Monitoring** - Server status, memory usage, connected clients, cache hit rate
- **Key Browser** - Browse, search, and filter Redis keys with pattern matching
- **Key Inspector** - View key values, types, and TTL
- **CLI Terminal** - Execute any Redis command directly from the panel
- **Configuration Viewer** - View all Redis server settings
- **Slow Log** - Monitor slow queries

## Installation

### Via ServerKit Marketplace (Recommended)

1. Open ServerKit panel
2. Go to Marketplace > Browse
3. Search for "Redis Manager"
4. Click Install

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/farhanturu/serverkit-redis.git

# Build frontend
cd serverkit-redis/frontend
npm ci
npm run build

# The extension is now ready to use
```

## Requirements

- Redis server installed and running on the host
- `redis-cli` available in PATH
- ServerKit 1.7.0 or higher

## Usage

### Accessing Redis Manager

1. Login to your ServerKit panel
2. Click "Redis" in the sidebar
3. View server status and metrics

### Browsing Keys

1. Go to the "Keys" tab
2. Enter a search pattern (e.g., `user:*`, `session:*`)
3. Click "Search" or press Enter
4. Click "View" to see key details
5. Click "Delete" to remove a key

### Running Commands

1. Go to the "Terminal" tab
2. Enter a Redis command (e.g., `INFO`, `PING`, `GET key`)
3. Click "Run" or press Enter
4. View the output

### Example Commands

```
# Server information
INFO

# List all keys
KEYS *

# Get a value
GET user:1:name

# Set a value
SET mykey "hello"

# Delete a key
DEL mykey

# Check memory usage
INFO memory

# Monitor real-time commands
MONITOR
```

## Configuration

The extension connects to Redis on `localhost:6379` by default. If your Redis instance uses a different configuration, you may need to modify the backend routes.

## Development

```bash
# Backend (Python/Flask)
cd backend
pip install -r requirements.txt
python app.py

# Frontend (React)
cd frontend
npm install
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

- GitHub Issues: https://github.com/farhanturu/serverkit-redis/issues
- Email: paongtech@gmail.com
- ServerKit Discord: https://discord.gg/serverkit
