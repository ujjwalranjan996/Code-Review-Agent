export interface Note {
  id: string;
  sessionId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

const API_KEY = "sn-api-key-4f9c1d2e8b7a4e6f9c0d1a2b3e4f5a6b";

function getToken(): string {
  let token = localStorage.getItem("accessToken");
  if (!token) {
    token = "guest";
    localStorage.setItem("accessToken", token);
  }
  return token;
}

async function authFetch(url: string) {
  const res = await fetch(url, {
    headers: {
      "x-api-key": API_KEY,
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const data: any = await res.json();
  return data;
}

export async function fetchNotes(sessionId: string): Promise<Note[]> {
  const data = await authFetch(`/api/sessions/${sessionId}/notes`);
  return data.notes;
}

export async function fetchUsers(): Promise<User[]> {
  const data = await authFetch("/api/users");
  return data.users;
}
