import axios from "axios";
import { supabase } from "../supabase";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: BASE_URL,
});

// Attach the login token to every axios request
client.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Same thing for fetch() calls
async function authHeaders(extra = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

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

export async function summarizeText(transcript) {
  const response = await client.post("/api/summarize-text", { transcript });
  return response.data;
}

export async function checkHealth() {
  const response = await client.get("/api/health");
  return response.data;
}

export async function fetchHistory() {
  const res = await fetch(`${BASE_URL}/api/history/`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

export async function fetchMeeting(id) {
  const res = await fetch(`${BASE_URL}/api/history/${id}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Meeting not found");
  return res.json();
}

export async function deleteMeeting(id) {
  const res = await fetch(`${BASE_URL}/api/history/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}

export async function generateEmail(summary) {
  const res = await fetch(`${BASE_URL}/api/email/generate`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(summary),
  });
  if (!res.ok) throw new Error("Failed to generate email");
  return res.json();
}

export async function updateMeetingTitle(id, title) {
  const res = await fetch(`${BASE_URL}/api/history/${id}/title`, {
    method: "PATCH",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
}

export default client;