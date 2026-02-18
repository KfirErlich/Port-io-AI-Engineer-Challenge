# Port AI Challenge

Node.js TypeScript project for Port.io integration with MCP server capabilities.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

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
/port-ai-challenge
├── .env                # משתני סביבה (PORT_CLIENT_ID, PORT_CLIENT_SECRET)
├── .gitignore          # להחריג את .env ואת node_modules
├── package.json        # הגדרות הפרויקט והתלויות
├── tsconfig.json       # הגדרות ה-TypeScript
├── README.md           # הסבר על הפתרון והוראות הרצה (קריטי להגשה!)
│
├── /src
│   ├── index.ts        # נקודת הכניסה
│   ├── port-api.ts     # פונקציות העזר לקריאות ה-API של Port
│   └── types.ts        # הגדרות Interfaces ל-Blueprints ו-Entities
│
└── /prompts
    └── system-prompt.txt # הטקסט שמגדיר ל-AI איך להתנהג (חלק 2 במטלה)
```

## Architecture

- **index.ts**: Main entry point that sets up the MCP server and registers tools
- **port-api.ts**: Helper functions for Port API calls (authentication, fetching blueprints)
- **types.ts**: TypeScript interfaces for Port data structures (Blueprints, Entities)
- **system-prompt.txt**: System prompt that defines AI behavior for the Port assistant

## License

ISC
