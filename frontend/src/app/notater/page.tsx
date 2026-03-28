'use client'

import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, Save, FileText } from 'lucide-react'
import { getNotes, createNote, updateNote, deleteNote, Note } from '@/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('nb-NO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function NotaterPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selected, setSelected] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getNotes().then(setNotes)
  }, [])

  function selectNote(note: Note) {
    setSelected(note)
    setTitle(note.title)
    setContent(note.content)
    setDirty(false)
  }

  function handleChange(newTitle: string, newContent: string) {
    setTitle(newTitle)
    setContent(newContent)
    setDirty(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autoSave(newTitle, newContent), 1500)
  }

  async function autoSave(t: string, c: string) {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updateNote(selected.id, { title: t, content: c })
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
      setSelected(updated)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleNew() {
    const note = await createNote({ title: 'Ny notat', content: '' })
    setNotes(prev => [note, ...prev])
    selectNote(note)
  }

  async function handleDelete(id: number) {
    await deleteNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selected?.id === id) {
      setSelected(null)
      setTitle('')
      setContent('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-600" />
          <h1 className="text-lg font-semibold text-gray-900">Notater</h1>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nytt notat
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r flex flex-col overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-6 text-sm text-gray-400 text-center mt-8">
              Ingen notater ennå.<br />Klikk «Nytt notat» for å starte.
            </div>
          ) : (
            notes.map(note => (
              <button
                key={note.id}
                onClick={() => selectNote(note)}
                className={`text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${selected?.id === note.id ? 'bg-sky-50 border-l-4 border-l-sky-600' : ''}`}
              >
                <div className="font-medium text-sm text-gray-900 truncate">
                  {note.title || 'Uten tittel'}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">
                  {note.content ? note.content.slice(0, 60) : 'Tom'}
                </div>
                <div className="text-xs text-gray-300 mt-1">{formatDate(note.updated_at)}</div>
              </button>
            ))
          )}
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col p-6 overflow-auto">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Velg et notat eller opprett et nytt</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl w-full mx-auto flex flex-col gap-4 flex-1">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={title}
                  onChange={e => handleChange(e.target.value, content)}
                  placeholder="Tittel..."
                  className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none flex-1 placeholder-gray-300"
                />
                <div className="flex items-center gap-3">
                  {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Save className="w-3 h-3" /> Lagrer...</span>}
                  {!saving && dirty && <span className="text-xs text-amber-500">Ulagret</span>}
                  {!saving && !dirty && selected && <span className="text-xs text-green-500">Lagret</span>}
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Slett notat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Sist endret: {formatDate(selected.updated_at)}
              </div>
              <textarea
                value={content}
                onChange={e => handleChange(title, e.target.value)}
                placeholder="Skriv notater her..."
                className="flex-1 min-h-[60vh] text-gray-800 bg-white border border-gray-200 rounded-xl p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-sky-200 resize-none"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
