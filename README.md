# Port AI Challenge - MCP Server (Streamable HTTP Edition)

Node.js TypeScript project for Port.io integration with MCP server capabilities. This project implements a Model Context Protocol (MCP) server that provides AI assistants with tools to interact with Port.io's Software Catalog API via a **Streamable HTTP transport**, allowing for remote connectivity through tunnels like ngrok.

**→ Want to run and connect this MCP server?** See [Quick start: Manually connect the MCP server](#-quick-start-manually-connect-the-mcp-server) below.

---

## 🏃 Quick start: Manually connect the MCP server

Use this guide to run the project locally and connect it to Port.io so others (or you) can test it.

### 1. Prerequisites

- **Node.js** v18 or higher  
- **npm** (or yarn)  
- **Port.io account** — you’ll need API credentials and access to create/edit MCP Server and AI Agent entities  
- **ngrok** — [install ngrok](https://ngrok.com/download) for exposing your local server to the internet

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables (`.env`)

Create a `.env` file in the project root. You can copy from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your Port.io OAuth credentials:

```env
PORT_CLIENT_ID=your_port_client_id
PORT_CLIENT_SECRET=your_port_client_secret
```

Get these from your Port.io environment: **Settings → Credentials** (or your org’s developer/API credentials).

### 4. Build (optional)

For a production-style run, build the TypeScript project:

```bash
npm run build
```

*Note: `npm start` uses `tsx` and runs the TypeScript source directly, so you can skip `npm run build` for local development.*

### 5. Start the MCP server

```bash
npm start
```

The server listens on **`http://localhost:3000/mcp`**. Leave this terminal running.

### 6. Expose with ngrok

In a **second terminal**, start ngrok:

```bash
ngrok http 3000
```

Copy the **HTTPS** URL ngrok shows (e.g. `https://abc123.ngrok-free.app`).  
The full MCP endpoint is: **`https://<your-ngrok-host>/mcp`** (e.g. `https://abc123.ngrok-free.app/mcp`).

### 7. Register the MCP server in Port.io

In the Port.io UI:

1. Create or edit the **MCP Server** entity.
2. Set the **URL** to your ngrok HTTPS URL + `/mcp`, e.g. `https://abc123.ngrok-free.app/mcp`.
3. Add a **Header** so ngrok doesn’t show the browser warning page:
   - **Name:** `ngrok-skip-browser-warning`
   - **Value:** `true`

### 8. Allow tools in your AI Agent

In your **AI Agent** configuration in Port.io, set the **Tools** regex so the agent can use this server’s tools, for example:

```text
^my_local_mcp_.*
```

(or the pattern that matches your MCP tool names).

After these steps, the MCP server is connected and the Port AI agent can call its tools.

---

## 🚀 Key Features

- **HTTP Server Support**: Express-based MCP server with StreamableHTTPServerTransport for remote connections
- **Session Management**: Full support for persistent AI sessions via `mcp-session-id` header
- **ngrok Compatibility**: Pre-configured to bypass browser warnings
- **Enhanced Logging**: Real-time terminal feedback for tool discovery and execution
- **Blueprint Management**: Complete CRUD operations for Port blueprints
- **Integration Management**: Full lifecycle management of Port integrations (create, update, configure, health checks, resync)
- **Entity Management**: Search and retrieve entities from the Port catalog
- **Production Readiness Templates**: Pre-built templates for Service and Environment blueprints
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Error Handling**: Comprehensive error handling with detailed error messages

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Port.io account with API credentials
- **ngrok** (for local-to-remote tunneling)

*Full setup steps (install, `.env`, `npm start`, ngrok, Port.io MCP + Agent config) are in [Quick start: Manually connect the MCP server](#-quick-start-manually-connect-the-mcp-server).*

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
│   ├── types.ts            # TypeScript interfaces
│   ├── /PortApi            # Port API client modules
│   │   ├── index.ts        # Exports all API functions
│   │   ├── auth.ts         # OAuth2 authentication
│   │   ├── blueprints.ts   # Blueprint CRUD operations & scorecards
│   │   ├── integrations.ts # Integration management (create, update, resync, health)
│   │   ├── entities.ts     # Entity search, retrieval, and upsert
│   │   ├── actions.ts      # Self-service action management
│   │   ├── pages.ts        # Page management (dashboards, blueprint-entities)
│   │   └── widgets.ts      # Widget management (add widgets to pages)
│   ├── /skills
│   │   ├── index.ts        # Skills aggregator (exports allSkills)
│   │   ├── /Scaffolding    # Catalog scaffolding skills
│   │   │   ├── inspect-blueprints.ts      # inspect_port_data_model
│   │   │   ├── upsert-blueprint.ts        # upsert_blueprint
│   │   │   ├── apply-production-readiness.ts  # apply_production_readiness_template
│   │   │   └── setup-catalog-relations.ts # setup_catalog_relations
│   │   ├── /Connectivity   # Integration management skills
│   │   │   ├── check-integration-health.ts    # check_integration_health
│   │   │   ├── configure-integration.ts       # configure_integration
│   │   │   └── trigger-resync.ts             # trigger_resync (PATCH-based)
│   │   ├── /Catalog        # Entity catalog skills
│   │   │   ├── get-integration-definition.ts  # get_integration_definition
│   │   │   ├── search-entities.ts             # search_entities
│   │   │   ├── get-entity.ts                  # get_entity
│   │   │   └── upsert-entity.ts              # upsert_entity
│   │   ├── /Governance     # Scorecard management skills
│   │   │   ├── create-scorecard.ts            # create_scorecard
│   │   │   ├── update-scorecard.ts            # update_scorecard
│   │   │   ├── delete-scorecard.ts            # delete_scorecard
│   │   │   └── get-all-scorecards.ts          # get_all_scorecards
│   │   ├── /Actions        # Self-service action skills
│   │   │   └── manage-self-service-action.ts  # manage_self_service_action
│   │   └── /Widgets        # Page and widget management skills
│   │       ├── create-page.ts                 # create_page
│   │       ├── add-widget-to-page.ts         # add_widget_to_page
│   │       ├── get-page.ts                    # get_page
│   │       └── list-pages.ts                  # list_pages
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

The Port API modules (`src/PortApi/`) provide comprehensive access to Port.io's API:

**Authentication (`auth.ts`)**:
* OAuth2 client credentials flow for Port API access
* Automatic token management and refresh

**Blueprint Operations (`blueprints.ts`)**:
* `getBlueprints()`: Retrieve all blueprints
* `getBlueprint()`: Get a specific blueprint by identifier
* `upsertBlueprint()`: Create or update a blueprint (automatically detects existence)
* `updateBlueprintRelations()`: Update blueprint relations
* `updateBlueprintSchemaProperties()`: Add or update properties in blueprint schema
* `createScorecard()`: Create a new scorecard for a blueprint
* `updateScorecard()`: Update an existing scorecard
* `deleteScorecard()`: Delete a scorecard
* `getAllScorecards()`: Get all scorecards across all blueprints

**Integration Operations (`integrations.ts`)**:
* `getIntegrations()`: List all installed integrations
* `createIntegration()`: Install a new integration with mapping configuration
* `updateIntegration()`: Update an existing integration's mapping with smart resource merging (preserves existing resources, updates matching ones by kind/blueprint, appends new ones)
* `triggerResync()`: Trigger a resync by "touching" integration configuration (uses PATCH)
* `getIntegrationDefinition()`: Retrieve full integration configuration including mappings

**Action Operations (`actions.ts`)**:
* `createAction()`: Create a new self-service action
* `updateAction()`: Update an existing self-service action (uses PATCH)
* `deleteAction()`: Delete a self-service action

**Page Operations (`pages.ts`)**:
* `listPages()`: List all pages in the portal
* `getPage()`: Get a page by identifier with full widget structure
* `createPage()`: Create a new dashboard or blueprint-entities page (includes root dashboard-widget for dashboards)

**Widget Operations (`widgets.ts`)**:
* `createRootDashboardWidget()`: Create the root dashboard-widget container on a page
* `addWidgetToPage()`: Add a widget to a page under a parent layout container (supports all widget types with type aliases)

**Entity Operations (`entities.ts`)**:
* `searchEntities()`: Search entities across blueprints with query filters
* `getEntity()`: Retrieve full details for a specific entity
* `upsertEntity()`: Create or update an entity using blueprint-scoped API (with upsert=true&merge=true)

**Error Handling**: Comprehensive error handling with detailed error messages and logging

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

The MCP server provides **20 skills** organized into five categories:

#### **Scaffolding Skills** (Catalog Setup & Management)

1. **inspect_port_data_model**
- **Description**: Inspect and retrieve complete Port data model information. Returns all blueprints with full schemas, properties, relations, and metadata. Essential for understanding the data model structure.
- **Input**: No parameters required (call with empty object `{}`)
- **Use Case**: Use when you need to understand the current catalog structure, schema details, or relationships between blueprints.

2. **upsert_blueprint**
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

3. **apply_production_readiness_template**
- **Description**: Strategic orchestrator that installs the core pillars for Production Readiness: Service, Environment, and Team blueprints, including their inter-relations. This is the recommended starting point for a governed software catalog.
- **Input**: Optional object with:
  - `includeEnvironment` (boolean, default: `true`): Whether to create the Environment blueprint
  - `includeTeam` (boolean, default: `true`): Whether to configure Team relations (Team blueprint is built-in)
- **What it creates**:
  - **Service Blueprint**: Core entity with properties: description, type, lifecycle, language, repository, documentation. Includes relations to Environment (many-to-many) and Team (ownership).
  - **Environment Blueprint**: Deployment environments with properties: type, region, url, description.
  - **Team Relations**: Configures Service blueprint relations to Port's built-in `_team` blueprint.
- **Use Case**: Use as the first step when setting up a new Port catalog or when you need a standardized Production Readiness foundation.

4. **setup_catalog_relations**
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

#### **Connectivity Skills** (Integration Management)

5. **check_integration_health**
- **Description**: Retrieves all installed integrations in Port and performs comprehensive health diagnostics. Checks installation status (Running), resync status (completed/failed), freshness (lastResyncEnd within 24h), and extracts error messages. Returns structured summary distinguishing Operational vs Degraded integrations.
- **Input**: No parameters required (call with empty object `{}`)
- **Use Case**: Use to monitor integration health, diagnose sync issues, or verify integration status after configuration changes.
- **Output**: Categorized list of integrations with health status, error details, and operational status (Operational/Degraded).

6. **configure_integration**
- **Description**: Installs a new integration or updates the JQ mapping of an existing one. Supports both creation and updates of integration configurations.
- **Input**: Object with required fields:
  - `integrationType` (string, required): Type of integration (e.g., 'github', 'jira')
  - `mapping` (object, required): JQ mapping configuration
  - `isNew` (boolean, default: false): Set to `true` for new installations, `false` for updates
  - `installationId` (string, optional): Required when `isNew=false` for updates
- **Example**:
  ```json
  {
    "integrationType": "github",
    "mapping": {
      "resources": [...]
    },
    "isNew": true
  }
  ```
- **Use Case**: Use to install new integrations or update existing integration mappings.

7. **trigger_resync**
- **Description**: Triggers a manual data resynchronization for a specific integration by "touching" its configuration. Uses PATCH to update the integration metadata, which automatically triggers Port's resync mechanism. **Note**: This replaces the previous POST-based resync endpoint approach.
- **Input**: Object with required field:
  - `identifier` (string, required): The installation identifier
- **Example**:
  ```json
  {
    "identifier": "installation-123"
  }
  ```
- **Technical Details**: 
  - Uses `PATCH /v1/integration/{identifier}` endpoint
  - Sends metadata update with timestamp: `{ metadata: { lastTriggered: ISO_DATE } }`
  - Port automatically triggers resync when configuration is updated
  - Enhanced error handling: Provides clear 404 error messages if installationId is incorrect
- **Use Case**: Use to manually trigger a resync when data appears stale or after mapping changes.

#### **Catalog Skills** (Entity Management)

8. **get_integration_definition**
- **Description**: Retrieves the full configuration JSON of a specific integration, including all mapping configurations. Essential for understanding how an integration is currently configured.
- **Input**: Object with required field:
  - `installationId` (string, required): The installation identifier
- **Example**:
  ```json
  {
    "installationId": "abc123"
  }
  ```
- **Use Case**: Use to inspect integration configuration, verify mappings, or troubleshoot integration issues.

9. **search_entities**
- **Description**: Searches for entities within the Port catalog. Supports filtering by blueprint and custom query rules. Essential for verifying data flow and finding specific entities.
- **Input**: Object with optional fields:
  - `blueprint` (string, optional): Filter by specific blueprint identifier
  - `query` (object, optional): Custom query with rules array. If not provided, defaults to empty object `{}` to return all entities for the blueprint.
- **Example**:
  ```json
  {
    "blueprint": "service",
    "query": {
      "rules": [
        {
          "property": "status",
          "operator": "=",
          "value": "active"
        }
      ]
    }
  }
  ```
- **Use Case**: Use to find entities matching specific criteria, verify data sync, or explore catalog contents.

10. **get_entity**
- **Description**: Retrieves full details for a single specific entity by blueprint and identifier. Returns complete entity data including properties, relations, and metadata.
- **Input**: Object with required fields:
  - `blueprint` (string, required): The blueprint identifier
  - `identifier` (string, required): The entity identifier
- **Example**:
  ```json
  {
    "blueprint": "service",
    "identifier": "my-service"
  }
  ```
- **Use Case**: Use to get detailed information about a specific entity, verify entity properties, or inspect entity relationships.

11. **upsert_entity**
- **Description**: Create or update an entity in a Port blueprint using the blueprint-scoped API with upsert and merge enabled. Automatically creates the entity if it doesn't exist, or updates it if it does.
- **Input**: Object with required fields:
  - `blueprint_identifier` (string, required): The blueprint identifier
  - `identifier` (string, required): The entity identifier
  - `title` (string, optional): Entity title
  - `icon` (string, optional): Entity icon
  - `properties` (object, optional): Entity properties
  - `relations` (object, optional): Entity relations
  - `teams` (array of strings, optional): Associated teams
- **Example**:
  ```json
  {
    "blueprint_identifier": "service",
    "identifier": "my-service",
    "title": "My Service",
    "properties": {
      "description": "A sample service"
    }
  }
  ```
- **Use Case**: Use to create or update entities programmatically, ensuring data consistency with merge behavior.

#### **Governance Skills** (Scorecard Management)

12. **create_scorecard**
- **Description**: Creates a new Scorecard for a specific blueprint to monitor service maturity and production readiness. Scorecards evaluate entities based on rules and assign levels.
- **Input**: Object with required fields:
  - `blueprint` (string, required): The blueprint identifier
  - `scorecard` (object, required): Scorecard definition with:
    - `identifier` (string, required): Scorecard identifier
    - `title` (string, required): Scorecard title
    - `rules` (array, required): Evaluation rules
    - `levels` (array, required): Scorecard levels (e.g., Bronze, Silver, Gold)
    - `filter` (object, optional): Filter conditions (defaults to `{ combinator: "and", conditions: [] }`)
- **Example**:
  ```json
  {
    "blueprint": "service",
    "scorecard": {
      "identifier": "production-readiness",
      "title": "Production Readiness",
      "rules": [...],
      "levels": [
        { "level": "Bronze", "color": "#8B4513" },
        { "level": "Silver", "color": "#C0C0C0" },
        { "level": "Gold", "color": "#FFD700" }
      ]
    }
  }
  ```
- **Use Case**: Use to create scorecards that evaluate and score entities based on defined criteria.

13. **update_scorecard**
- **Description**: Updates an existing Scorecard's definition, levels, or rules for a blueprint.
- **Input**: Object with required fields:
  - `blueprint` (string, required): The blueprint identifier
  - `scorecardIdentifier` (string, required): The existing scorecard identifier
  - `scorecard` (object, required): Updated scorecard definition (same structure as create_scorecard)
- **Example**:
  ```json
  {
    "blueprint": "service",
    "scorecardIdentifier": "production-readiness",
    "scorecard": {
      "identifier": "production-readiness",
      "title": "Updated Production Readiness",
      "rules": [...],
      "levels": [...]
    }
  }
  ```
- **Use Case**: Use to modify existing scorecard rules, levels, or filters.

14. **delete_scorecard**
- **Description**: Deletes an existing scorecard from a blueprint.
- **Input**: Object with required fields:
  - `blueprint` (string, required): The blueprint identifier
  - `scorecardIdentifier` (string, required): The scorecard identifier to delete
- **Example**:
  ```json
  {
    "blueprint": "service",
    "scorecardIdentifier": "production-readiness"
  }
  ```
- **Use Case**: Use to remove scorecards that are no longer needed.

15. **get_all_scorecards**
- **Description**: Retrieves all scorecards across all blueprints in the organization.
- **Input**: No parameters required (call with empty object `{}`)
- **Use Case**: Use to discover and inspect all scorecards in the organization.

#### **Actions Skills** (Self-Service Actions)

16. **manage_self_service_action**
- **Description**: A unified tool to Create, Update (PATCH), or Delete self-service actions in Port. Self-service actions enable users to trigger automated workflows from the Port UI.
- **Input**: Object with required fields:
  - `operation` (enum, required): One of `"create"`, `"update"`, or `"delete"`
  - `identifier` (string, required): The action identifier
  - `actionData` (object, optional): Required for create/update operations, containing:
    - `title` (string, optional): Action title
    - `trigger` (any, optional): Trigger configuration
    - `invocationMethod` (any, optional): Invocation method (e.g., webhook, API)
    - `description` (string, optional): Action description
    - `publish` (boolean, optional): Whether to publish the action
- **Example (Create)**:
  ```json
  {
    "operation": "create",
    "identifier": "deploy-service",
    "actionData": {
      "title": "Deploy Service",
      "description": "Deploy a service to production",
      "invocationMethod": {
        "type": "WEBHOOK",
        "url": "https://api.example.com/deploy"
      },
      "publish": true
    }
  }
  ```
- **Example (Update)**:
  ```json
  {
    "operation": "update",
    "identifier": "deploy-service",
    "actionData": {
      "title": "Updated Deploy Service",
      "publish": false
    }
  }
  ```
- **Example (Delete)**:
  ```json
  {
    "operation": "delete",
    "identifier": "deploy-service"
  }
  ```
- **Use Case**: Use to manage self-service actions that enable automated workflows and integrations.

#### **Widgets Skills** (Page and Widget Management)

17. **create_page**
- **Description**: Creates a new dashboard or blueprint-entities page in Port. For dashboards, automatically creates a root dashboard-widget container so the page is ready to accept widgets. Returns rootWidgetId for dashboards—use it as parentWidgetId when calling add_widget_to_page. If the page identifier already exists, gracefully retrieves the existing page instead of failing.
- **Input**: Object with required fields:
  - `identifier` (string, required): Page identifier
  - `title` (string, required): Page title
  - `type` (enum, required): Either `"dashboard"` or `"blueprint-entities"`
  - `icon` (string, optional): Page icon
  - `description` (string, optional): Page description
  - `showInSidebar` (boolean, optional): Whether to show in sidebar
  - `section` (string, optional): Sidebar section
- **Example**:
  ```json
  {
    "identifier": "my-dashboard",
    "title": "My Dashboard",
    "type": "dashboard",
    "icon": "Dashboard",
    "description": "A custom dashboard"
  }
  ```
- **Use Case**: Use to create custom dashboards or blueprint-entities pages for organizing and visualizing catalog data.

18. **add_widget_to_page**
- **Description**: Adds a widget to a Port page. The parent must be a dashboard-widget (use rootWidgetId from create_page or get_page for dashboards). Supports any Port widget type including ai-agent, markdown, table-entities-explorer, entities-pie-chart, and more. Widget type aliases are automatically mapped (e.g., "pie-chart" → "entities-pie-chart").
- **Input**: Object with required fields:
  - `pageIdentifier` (string, required): The page identifier
  - `parentWidgetId` (string, required): The parent widget ID (must be a dashboard-widget)
  - `widgetConfig` (object, required): Widget configuration with:
    - `type` (string, required): Widget type (e.g., "ai-agent", "markdown", "entities-pie-chart", "table-entities-explorer")
    - `title` (string, required): Widget title
    - `description` (string, optional): Widget description
    - `icon` (string, optional): Widget icon
    - Type-specific fields:
      - For `ai-agent`: `agentIdentifier`, `useMCP`
      - For `markdown`: `markdown`
      - For `entities-pie-chart`: `blueprint`, `property` (with property# prefix automatically added)
      - For `table-entities-explorer`: `blueprint`, `dataset`
- **Example**:
  ```json
  {
    "pageIdentifier": "my-dashboard",
    "parentWidgetId": "widget-123",
    "widgetConfig": {
      "type": "entities-pie-chart",
      "title": "Services by Readiness",
      "blueprint": "service",
      "property": "production_readiness"
    }
  }
  ```
- **Use Case**: Use to add widgets to dashboards for visualizing catalog data, displaying AI agents, or showing markdown content.

19. **get_page**
- **Description**: Retrieves the full page JSON from Port for a given page identifier. Returns the complete response including the widgets array, so the Agent can extract id fields of existing layout containers (e.g., rootWidgetId for dashboards).
- **Input**: Object with required field:
  - `identifier` (string, required): The page identifier
- **Example**:
  ```json
  {
    "identifier": "my-dashboard"
  }
  ```
- **Use Case**: Use to inspect existing pages, retrieve rootWidgetId for adding widgets, or understand page structure.

20. **list_pages**
- **Description**: Returns a list of all pages in the Port portal with their identifier and title. Use this to discover existing pages before injecting widgets (e.g., with add_widget_to_page). For full page structure including widgets and rootWidgetId, use get_page.
- **Input**: No parameters required (call with empty object `{}`)
- **Use Case**: Use to discover existing pages before adding widgets or to get an overview of all pages in the portal.

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

### Example 5: Check Integration Health

```json
{
  "method": "tools/call",
  "params": {
    "name": "check_integration_health",
    "arguments": {}
  }
}
```

### Example 6: Configure Integration

```json
{
  "method": "tools/call",
  "params": {
    "name": "configure_integration",
    "arguments": {
      "integrationType": "github",
      "mapping": {
        "resources": [
          {
            "kind": "repo",
            "port": {
              "entity": {
                "mappings": {
                  "$identifier": ".name",
                  "$title": ".name"
                  }
              }
            }
          }
        ]
      },
      "isNew": true
    }
  }
}
```

### Example 7: Trigger Integration Resync

```json
{
  "method": "tools/call",
  "params": {
    "name": "trigger_resync",
    "arguments": {
      "identifier": "installation-123"
    }
  }
}
```

### Example 8: Search Entities

```json
{
  "method": "tools/call",
  "params": {
    "name": "search_entities",
    "arguments": {
      "blueprint": "service",
      "query": {}
    }
  }
}
```

### Example 9: Get Entity Details

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_entity",
    "arguments": {
      "blueprint": "service",
      "identifier": "my-service"
    }
  }
}
```

### Example 10: Upsert Entity

```json
{
  "method": "tools/call",
  "params": {
    "name": "upsert_entity",
    "arguments": {
      "blueprint_identifier": "service",
      "identifier": "my-service",
      "title": "My Service",
      "properties": {
        "description": "A sample service"
      }
    }
  }
}
```

### Example 11: Create Scorecard

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_scorecard",
    "arguments": {
      "blueprint": "service",
      "scorecard": {
        "identifier": "production-readiness",
        "title": "Production Readiness",
        "rules": [
          {
            "identifier": "has-docs",
            "level": "Gold",
            "query": {
              "combinator": "and",
              "conditions": [
                {
                  "property": "$blueprint",
                  "operator": "=",
                  "value": "service"
                },
                {
                  "property": "documentation",
                  "operator": "isNotEmpty"
                }
              ]
            }
          }
        ],
        "levels": [
          { "level": "Bronze", "color": "#8B4513" },
          { "level": "Silver", "color": "#C0C0C0" },
          { "level": "Gold", "color": "#FFD700" }
        ]
      }
    }
  }
}
```

### Example 12: Create Page

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_page",
    "arguments": {
      "identifier": "my-dashboard",
      "title": "My Dashboard",
      "type": "dashboard",
      "icon": "Dashboard"
    }
  }
}
```

### Example 13: Add Widget to Page

```json
{
  "method": "tools/call",
  "params": {
    "name": "add_widget_to_page",
    "arguments": {
      "pageIdentifier": "my-dashboard",
      "parentWidgetId": "root-widget-id-from-create-page",
      "widgetConfig": {
        "type": "entities-pie-chart",
        "title": "Services by Readiness",
        "blueprint": "service",
        "property": "production_readiness"
      }
    }
  }
}
```

### Example 14: Manage Self-Service Action

```json
{
  "method": "tools/call",
  "params": {
    "name": "manage_self_service_action",
    "arguments": {
      "operation": "create",
      "identifier": "deploy-service",
      "actionData": {
        "title": "Deploy Service",
        "description": "Deploy a service to production",
        "invocationMethod": {
          "type": "WEBHOOK",
          "url": "https://api.example.com/deploy"
        },
        "publish": true
      }
    }
  }
}
```

## 🔄 Recent Changes

### Integration Resync Implementation Update

**Changed**: The `trigger_resync` skill has been updated to use PATCH instead of POST.

**Previous Implementation**:
- Used `POST /v1/integration/{type}/{id}/resync` endpoint
- Required both `integrationType` and `identifier` parameters

**Current Implementation**:
- Uses `PATCH /v1/integration/{identifier}` endpoint
- Only requires `identifier` parameter
- Sends metadata update: `{ metadata: { lastTriggered: ISO_DATE } }`
- Port automatically triggers resync when integration configuration is updated
- Enhanced error handling with specific 404 messages for incorrect installation IDs

**Why**: The Port API for this integration type does not expose a standard POST resync endpoint. The PATCH approach "touches" the integration configuration, which triggers Port's automatic resync mechanism.

**Migration**: Existing code using `trigger_resync` should remove the `integrationType` parameter and only pass `identifier`.

### Integration Update Enhancement

**Changed**: The `updateIntegration()` function now includes smart resource merging logic.

**Features**:
- Preserves all existing integration resources
- Updates matching resources by `kind` and `blueprint` properties
- Appends new resources that don't match existing ones
- Handles nested mapping structures (extracts from `port.resources` or `resources` arrays)
- Validates final resource structure (ensures flat array with required `kind` property)
- Enhanced error logging for 422 validation errors

**Why**: Provides safer integration updates that preserve existing configuration while allowing incremental changes.

### New Skills Added

**Governance Skills** (4 new skills):
- `create_scorecard`: Create scorecards for blueprint evaluation
- `update_scorecard`: Update existing scorecards
- `delete_scorecard`: Delete scorecards
- `get_all_scorecards`: Retrieve all scorecards across blueprints

**Catalog Skills** (1 new skill):
- `upsert_entity`: Create or update entities with merge support

**Actions Skills** (1 new skill):
- `manage_self_service_action`: Unified tool for creating, updating, or deleting self-service actions

**Widgets Skills** (4 new skills):
- `create_page`: Create dashboard or blueprint-entities pages
- `add_widget_to_page`: Add widgets to pages (supports all widget types)
- `get_page`: Retrieve full page structure
- `list_pages`: List all pages in the portal

### New API Modules

**Actions API (`actions.ts`)**:
- Full CRUD operations for self-service actions
- Supports creating, updating (PATCH), and deleting actions
- Comprehensive error handling for 400/422/404 responses

**Pages API (`pages.ts`)**:
- List, get, and create pages
- Automatic root dashboard-widget creation for dashboards
- Graceful handling of existing page identifiers

**Widgets API (`widgets.ts`)**:
- Create root dashboard-widget containers
- Add widgets to pages with type alias support
- Property formatting with automatic `property#` prefixing

### Blueprint API Enhancements

**New Functions**:
- `updateBlueprintRelations()`: Update blueprint relations
- `updateBlueprintSchemaProperties()`: Add/update schema properties
- `createScorecard()`: Create scorecards
- `updateScorecard()`: Update scorecards
- `deleteScorecard()`: Delete scorecards
- `getAllScorecards()`: Get all scorecards

### Entity API Enhancements

**New Function**:
- `upsertEntity()`: Create or update entities using blueprint-scoped API with upsert and merge enabled