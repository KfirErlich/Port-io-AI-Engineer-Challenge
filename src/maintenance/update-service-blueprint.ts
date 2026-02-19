// Maintenance script to update the service blueprint with url and description properties
// This ensures that the GitHub mapping (which already sends these fields) has a place to store them
import dotenv from "dotenv";
import { updateBlueprintSchemaProperties } from "../PortApi/blueprints.js";

dotenv.config();

async function updateServiceBlueprint() {
  console.error("Updating service blueprint with url and description properties...");

  const newProperties = {
    url: {
      type: "string",
      format: "url",
      title: "URL",
    },
    description: {
      type: "string",
      title: "Description",
    },
  };

  try {
    const result = await updateBlueprintSchemaProperties("service", newProperties);

    if (result.success) {
      console.error("✓ Successfully updated service blueprint");
      console.error(`  Added properties: url, description`);
      if (result.blueprint) {
        console.error(`  Blueprint identifier: ${result.blueprint.identifier}`);
      }
    } else {
      console.error("✗ Failed to update service blueprint");
      console.error(`  Error: ${JSON.stringify(result.error, null, 2)}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Unexpected error updating service blueprint");
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the update
updateServiceBlueprint();
