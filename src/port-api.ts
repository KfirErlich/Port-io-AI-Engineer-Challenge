// פונקציות העזר לקריאות ה-API של Port
import axios from "axios";
import { PortBlueprint } from "./types.js";

const PORT_API_URL = "https://api.port.io/v1";

/**
 * מקבל access token מ-Port API באמצעות client credentials
 */
export async function getAccessToken(): Promise<string> {
  const response = await axios.post(`${PORT_API_URL}/auth/access_token`, {
    clientId: process.env.PORT_CLIENT_ID,
    clientSecret: process.env.PORT_CLIENT_SECRET,
  });
  return response.data.accessToken;
}

/**
 * מביא את כל ה-blueprints הקיימים ב-Port
 */
export async function getBlueprints(): Promise<PortBlueprint[]> {
  const token = await getAccessToken();
  const response = await axios.get(`${PORT_API_URL}/blueprints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.blueprints || [];
}
