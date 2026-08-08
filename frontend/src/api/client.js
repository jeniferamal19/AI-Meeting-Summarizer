import axios from "axios";

// Set VITE_API_BASE_URL in frontend/.env if your backend runs somewhere
// other than http://localhost:8000 (see .env.example).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: BASE_URL,
});

/**
 * Uploads an audio file and returns the transcript + structured summary.
 * Expects the backend to expose POST /api/process as described in the
 * project's build plan:
 *   { transcript: string,
 *     summary: { summary, key_decisions, action_items, topics_discussed } }
 */
export async function processMeeting(file, { onUploadProgress } = {}) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await client.post("/api/process", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onUploadProgress && event.total) {
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return response.data;
}

export async function checkHealth() {
  const response = await client.get("/api/health");
  return response.data;
}

export default client;
