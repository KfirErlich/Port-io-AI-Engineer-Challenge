# Port AI Challenge

Node.js TypeScript project for Port.io integration with MCP server capabilities. This project implements a Model Context Protocol (MCP) server that provides AI assistants with tools to interact with Port.io's Software Catalog API.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Port.io account with API credentials (Client ID and Client Secret)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT_CLIENT_ID=your_client_id
PORT_CLIENT_SECRET=your_client_secret
```

You can copy `.env.example` to `.env` and fill in your credentials.

## Development

Build the project:
```bash
npm run build
```

Watch mode (auto-rebuild on changes):
```bash
npm run dev
```

Run the compiled code:
```bash
npm start
```

Clean build artifacts:
```bash
npm run clean
```

## Project Structure

```
port-assignment/
├── .env                    # Environment variables (PORT_CLIENT_ID, PORT_CLIENT_SECRET)
├── .gitignore              # Git ignore rules (excludes .env and node_modules)
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── README.md               # Project documentation
│
├── /src
│   ├── index.ts            # Main entry point - MCP server setup and skill registration
│   ├── port-api.ts         # Port API client functions (authentication, API calls)
│   ├── types.ts            # TypeScript interfaces for Port data structures
│   │
│   └── /skills
│       ├── index.ts        # Skills aggregator - exports all available skills
│       ├── types.ts        # Skill interface definitions
│       ├── blueprints.ts   # Blueprint-related skills
│       └── entities.ts     # Entity-related skills (placeholder for future implementation)
│
└── /dist                   # Compiled JavaScript output (generated)
```

## Architecture

### Core Components

- **index.ts**: 
  - Main entry point that initializes the MCP server
  - Registers all available skills as MCP tools
  - Sets up stdio transport for MCP communication

- **port-api.ts**: 
  - `getAccessToken()`: Authenticates with Port API using client credentials
  - `getBlueprints()`: Fetches all blueprints from Port catalog
  - Handles API authentication and HTTP requests

- **types.ts**: 
  - `PortBlueprint`: Interface for blueprint data structure
  - `PortEntity`: Interface for entity data structure

### Skills Architecture

The project uses a modular skills-based architecture where each skill is a self-contained MCP tool:

#### Skills Module (`/src/skills/`)

- **index.ts**: 
  - Aggregates all skills from different modules
  - Exports `allSkills` array for registration

- **types.ts**: 
  - Defines the `Skill` interface that all skills must implement
  - Ensures consistent skill structure across the codebase

- **blueprints.ts**: 
  - `inspect_port_data_model`: Fetches and returns all blueprints from Port
  - Helps AI assistants understand the user's infrastructure data model

- **entities.ts**: 
  - Currently contains placeholder structure for entity-related skills
  - Ready for future implementation of entity manipulation skills

### Current Implementation Status

✅ **Completed:**
- MCP server setup and configuration
- Port API authentication (client credentials flow)
- Blueprint fetching functionality
- `inspect_port_data_model` skill implementation
- Modular skills architecture
- TypeScript type definitions

🚧 **In Progress / Planned:**
- Entity-related skills (create, update, delete entities)
- Additional blueprint operations
- Error handling and validation
- More comprehensive Port API integration

## How It Works

1. **Server Initialization**: The MCP server starts and registers all available skills as tools
2. **Skill Registration**: Each skill in the `/src/skills` directory is registered as an MCP tool
3. **API Integration**: Skills can call Port API functions through `port-api.ts` to interact with Port.io
4. **Tool Execution**: When an AI assistant calls a skill, it executes the handler function and returns results

## Skills

### Available Skills

- **inspect_port_data_model**: Fetches current blueprints to understand the user's infrastructure data model

### Skill Structure

Each skill follows this structure:
```typescript
{
  name: "skill_name",
  description: "What the skill does",
  inputSchema: {}, // JSON schema for input parameters
  handler: async (args) => {
    // Skill implementation
    return { content: [{ type: "text", text: "result" }] };
  }
}
```

## License

ISC
