import { useSessionNotes } from "./useSessionNotes";

interface SessionNotesProps {
  sessionId: string;
}

export function SessionNotes({ sessionId }: SessionNotesProps) {
  const { notes, query, search, loading } = useSessionNotes(sessionId);

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading notes…</div>;
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search notes…"
        className="rounded border px-3 py-2 text-sm"
      />
      <ul className="flex flex-col gap-2">
        {notes.map((note, index) => (
          <li key={index} className="flex gap-3 rounded border p-3">
            <img src={note.author?.avatarUrl} />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">{note.author?.name ?? "Unknown"}</span>
              <div dangerouslySetInnerHTML={{ __html: note.body }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
