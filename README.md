# Port AI Challenge - MCP Server (Streamable HTTP Edition)

Node.js TypeScript project for Port.io integration with MCP server capabilities. This project implements a Model Context Protocol (MCP) server that provides AI assistants with tools to interact with Port.io's Software Catalog API via a **Streamable HTTP transport**, allowing for remote connectivity through tunnels like ngrok.

## 🚀 Key Features

- **HTTP Server Support**: Express-based MCP server with StreamableHTTPServerTransport for remote connections
- **Session Management**: Full support for persistent AI sessions via `mcp-session-id` header
- **ngrok Compatibility**: Pre-configured to bypass browser warnings
- **Enhanced Logging**: Real-time terminal feedback for tool discovery and execution
- **Blueprint Management**: Complete CRUD operations for Port blueprints
- **Production Readiness Templates**: Pre-built templates for Service and Environment blueprints
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Error Handling**: Comprehensive error handling with detailed error messages

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

## 📂 Project Structure

```
port-assignment/
├── .env                    # Environment variables
├── package.json            # Scripts: build, dev, start
├── src/
│   ├── index.ts            # Main entry point - Express server & HTTP Transport setup
│   ├── port-api.ts         # Port API client (Auth & Blueprint operations)
│   ├── types.ts            # TypeScript interfaces
│   ├── /skills
│   │   ├── index.ts        # Skills aggregator (exports allSkills)
│   │   ├── inspect-blueprints.ts   # inspect_port_data_model skill
│   │   ├── upsert-blueprint.ts     # upsert_blueprint skill
│   │   ├── apply-production-readiness.ts  # apply_production_readiness_template skill
│   │   ├── setup-catalog-relations.ts  # setup_catalog_relations skill
│   │   └── entities.ts     # Placeholder for entity-related skills
│   └── /templates
│       └── blueprints.ts   # Production Readiness blueprint templates
└── /dist                   # Compiled output

```

## ⚙️ Architecture

### 1. Streamable HTTP Transport

The server uses `StreamableHTTPServerTransport` instead of `stdio`, enabling:

* **Multiple Sessions**: Uses `randomUUID` to handle different AI conversations simultaneously
* **REST Endpoints**: Implements `POST`, `GET`, and `DELETE` handlers for full MCP protocol support
* **Remote Connectivity**: Allows connections through tunnels like ngrok for Port.io integration

### 2. Session Management

* **Persistent Sessions**: Full support for persistent AI sessions via `mcp-session-id` header
* **Session Tracking**: Each session maintains its own transport and server instance
* **Automatic Cleanup**: Sessions are cleaned up when connections close

### 3. CORS & Header Exposure

Configured Express middleware to expose `mcp-session-id`. This allows the Port.io frontend to track the session state across multiple requests.

### 4. Port API Integration

The `port-api.ts` module provides:

* **Authentication**: OAuth2 client credentials flow for Port API access
* **Blueprint Operations**: `getBlueprints()`, `getBlueprint()`, `upsertBlueprint()`
* **Error Handling**: Comprehensive error handling with detailed error messages
* **Upsert Logic**: Automatically detects if a blueprint exists and creates or updates accordingly

### 5. Skills Architecture

Skills are modular and follow a consistent pattern:

* **Input Validation**: Uses Zod schemas for type-safe input validation
* **Error Handling**: Comprehensive error handling with user-friendly messages
* **Logging**: Detailed console logging for debugging and monitoring
* **Type Safety**: Full TypeScript support with proper types

### 6. Debugging & Health Endpoints

Added specialized endpoints for troubleshooting:

* `/health`: Verifies tool registration and shows active sessions
* `/test-tools`: Simulates a tool listing request
* `/test-tools-list`: POST endpoint to test tools/list functionality

## 🛠️ Skills

### Available Skills

The MCP server provides four main skills for interacting with Port.io's Software Catalog:

#### 1. **inspect_port_data_model**
- **Description**: Inspect and retrieve complete Port data model information. Returns all blueprints with full schemas, properties, relations, and metadata. Essential for understanding the data model structure.
- **Input**: No parameters required (call with empty object `{}`)
- **Use Case**: Use when you need to understand the current catalog structure, schema details, or relationships between blueprints.

#### 2. **upsert_blueprint**
- **Description**: Create or update a single blueprint in Port. Use this for custom infrastructure design or specific modifications. Allows dynamic blueprint creation based on conversation context.
- **Input**: Object with required key `blueprint` containing:
  - `identifier` (string, required): Unique blueprint identifier
  - `title` (string, required): Human-readable title
  - `icon` (string, optional): Icon identifier
  - `schema` (object, optional): Schema definition with `properties` and optional `required` array
  - `relations` (object, optional): Relations to other blueprints
  - `mirrorProperties` (object, optional): Mirror property definitions
  - `calculationProperties` (object, optional): Calculated property definitions
  - `aggregationProperties` (object, optional): Aggregation property definitions
- **Example**:
  ```json
  {
    "blueprint": {
      "identifier": "service",
      "title": "Service",
      "schema": {
        "properties": {
          "description": { "type": "string" }
        },
        "required": ["description"]
      }
    }
  }
  ```
- **Use Case**: Use when creating custom blueprints or modifying existing ones with specific properties.

#### 3. **apply_production_readiness_template**
- **Description**: Strategic orchestrator that installs the core pillars for Production Readiness: Service, Environment, and Team blueprints, including their inter-relations. This is the recommended starting point for a governed software catalog.
- **Input**: Optional object with:
  - `includeEnvironment` (boolean, default: `true`): Whether to create the Environment blueprint
  - `includeTeam` (boolean, default: `true`): Whether to configure Team relations (Team blueprint is built-in)
- **What it creates**:
  - **Service Blueprint**: Core entity with properties: description, type, lifecycle, language, repository, documentation. Includes relations to Environment (many-to-many) and Team (ownership).
  - **Environment Blueprint**: Deployment environments with properties: type, region, url, description.
  - **Team Relations**: Configures Service blueprint relations to Port's built-in `_team` blueprint.
- **Use Case**: Use as the first step when setting up a new Port catalog or when you need a standardized Production Readiness foundation.

#### 4. **setup_catalog_relations**
- **Description**: Add a relation to a blueprint that connects it to another blueprint. Use this to establish relationships between blueprints (e.g., Service -> Team, Service -> Environment). This skill uses PATCH to update the blueprint's relations object, preserving existing relations.
- **Input**: Object with required fields:
  - `sourceBlueprint` (string, required): The identifier of the blueprint where the relation starts
  - `relationName` (string, required): The identifier for the relation (e.g., 'owner', 'environment', 'environment_test')
  - `targetBlueprint` (string, required): The identifier of the blueprint it points to (e.g., '_team', 'environment')
  - `many` (boolean, required): Whether this is a many-to-many or one-to-many relation (`true`) or one-to-one (`false`)
  - `title` (string, optional): Human-readable title for the relation. If not provided, `relationName` will be used.
  - `required` (boolean, optional): Whether the relation is required (default: `false`)
- **Example**:
  ```json
  {
    "sourceBlueprint": "service",
    "relationName": "environment_test",
    "targetBlueprint": "environment",
    "many": true,
    "title": "Test Environment",
    "required": false
  }
  ```
- **Use Case**: Use when you need to add or modify relations between existing blueprints. The skill preserves all existing relations and only adds or updates the specified relation.

### Template System

The project includes a template system (`src/templates/blueprints.ts`) that provides standardized blueprint definitions following Port.io best practices:

- **SERVICE_BLUEPRINT**: Standard service blueprint with production-ready properties
- **ENVIRONMENT_BLUEPRINT**: Standard environment blueprint for deployment tracking
- **PRODUCTION_READINESS_TEMPLATES**: Complete template set for quick setup

Templates can be customized and extended using the `upsert_blueprint` skill.

## 📖 Usage Examples

### Example 1: Inspect Current Data Model

```json
{
  "method": "tools/call",
  "params": {
    "name": "inspect_port_data_model",
    "arguments": {}
  }
}
```

### Example 2: Apply Production Readiness Template

```json
{
  "method": "tools/call",
  "params": {
    "name": "apply_production_readiness_template",
    "arguments": {
      "includeEnvironment": true,
      "includeTeam": true
    }
  }
}
```

### Example 3: Create a Custom Blueprint

```json
{
  "method": "tools/call",
  "params": {
    "name": "upsert_blueprint",
    "arguments": {
      "blueprint": {
        "identifier": "microservice",
        "title": "Microservice",
        "icon": "Microservice",
        "schema": {
          "properties": {
            "name": {
              "title": "Name",
              "type": "string"
            },
            "version": {
              "title": "Version",
              "type": "string"
            }
          },
          "required": ["name"]
        }
      }
    }
  }
}
```

### Example 4: Setup Relations Between Blueprints

```json
{
  "method": "tools/call",
  "params": {
    "name": "setup_catalog_relations",
    "arguments": {
      "sourceBlueprint": "service",
      "relationName": "environment_test",
      "targetBlueprint": "environment",
      "many": true,
      "title": "Test Environment",
      "required": false
    }
  }
}
```