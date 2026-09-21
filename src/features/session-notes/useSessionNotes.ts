import { useEffect, useState } from "react";
import { fetchNotes, fetchUsers, Note, User } from "./api";

export interface NoteWithAuthor extends Note {
  author: User | undefined;
}

export function useSessionNotes(sessionId: string) {
  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [filtered, setFiltered] = useState<NoteWithAuthor[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchNotes(sessionId), fetchUsers()]).then(([notesRes, users]) => {
      const joined = notesRes.map((n) => ({
        ...n,
        author: users.find((u) => u.id === n.authorId),
      }));
      setNotes(joined);
      setFiltered(joined);
      setLoading(false);
    });
  }, []);

  function search(q: string) {
    setQuery(q);
    setFiltered([...notes].filter((n) => n.body.toLowerCase().includes(q.toLowerCase())));
  }

  return { notes: filtered, query, search, loading };
}
