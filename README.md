```markdown
# Port AI Challenge - MCP Server (Streamable HTTP Edition)

Node.js TypeScript project for Port.io integration with MCP server capabilities. This project implements a Model Context Protocol (MCP) server that provides AI assistants with tools to interact with Port.io's Software Catalog API via a **Streamable HTTP transport**, allowing for remote connectivity through tunnels like ngrok.

## 🚀 Key Features Added
- **HTTP Server Support**: Migrated from `stdio` to `Express` to allow remote connections.
- **Session Management**: Full support for persistent AI sessions via `mcp-session-id`.
- **ngrok Compatibility**: Pre-configured to bypass browser warnings.
- **Enhanced Logging**: Real-time terminal feedback for tool discovery and execution.

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Port.io account with API credentials
- **ngrok** (for local-to-remote tunneling)

## 🛠️ Installation

```bash
npm install

```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
PORT_CLIENT_ID=your_client_id
PORT_CLIENT_SECRET=your_client_secret

```

## 🏗️ Development & Deployment

1. **Build the project:**
```bash
npm run build

```


2. **Start the server:**
```bash
npm start

```


*The server will run on `http://localhost:3000/mcp`.*
3. **Expose to Port.io (via ngrok):**
```bash
ngrok http 3000

```


*Copy the `https` URL provided by ngrok (e.g., `https://xxxx.ngrok-free.app/mcp`).*

## 🔌 Connectivity Configuration

To allow Port AI to communicate with this server, the following configurations are required in the Port.io UI:

### Port.io MCP Entity Setup

When registering the MCP Server entity in Port, ensure the following **Headers** are added:

```json
{
  "ngrok-skip-browser-warning": "true"
}

```

### AI Agent Configuration

Ensure your AI Agent entity has the following **Tools** regex pattern allowed:

```text
^my_local_mcp_.*

```

## 📂 Project Structure (Updated)

```
port-assignment/
├── .env                    # Environment variables
├── package.json            # Scripts: build, dev, start
├── src/
│   ├── index.ts            # Main entry point - Express server & HTTP Transport setup
│   ├── port-api.ts         # Port API client (Auth & Data fetching)
│   ├── types.ts            # TypeScript interfaces
│   └── /skills
│       ├── index.ts        # Skills aggregator
│       └── blueprints.ts   # inspect_port_data_model implementation
└── /dist                   # Compiled output

```

## ⚙️ Architecture Changes

### 1. Streamable HTTP Transport

We replaced the default `stdio` transport with `StreamableHTTPServerTransport`. This enables:

* **Multiple Sessions**: Uses `randomUUID` to handle different AI conversations simultaneously.
* **REST Endpoints**: Implements `POST`, `GET`, and `DELETE` handlers for full MCP protocol support.

### 2. CORS & Header Exposure

Configured Express middleware to expose `mcp-session-id`. This allows the Port.io frontend to track the session state across multiple requests.

### 3. Debugging & Health

Added specialized endpoints for troubleshooting:

* `/health`: Verifies tool registration.
* `/test-tools`: Simulates a tool listing request.

## 🛠️ Skills

### Available Skills

* **inspect_port_data_model**: Fetches current blueprints to analyze the infrastructure data model.
* *Fix implemented: Uses synchronous `safeParse` for high-reliability schema validation.*

```