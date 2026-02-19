// Authentication API functions
import axios from "axios";

const PORT_API_URL = "https://api.port.io/v1";

/**
 * Get access token from Port API using client credentials
 */
export async function getAccessToken(): Promise<string> {
  const response = await axios.post(`${PORT_API_URL}/auth/access_token`, {
    clientId: process.env.PORT_CLIENT_ID,
    clientSecret: process.env.PORT_CLIENT_SECRET,
  });
  return response.data.accessToken;
}
