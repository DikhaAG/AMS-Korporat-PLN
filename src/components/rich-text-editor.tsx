"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert min-h-[300px] border rounded-md p-4 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2 p-1 bg-muted rounded-md">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${editor?.isActive('bold') ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${editor?.isActive('italic') ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
        >
          H2
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
