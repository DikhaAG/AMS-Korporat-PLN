"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '../ui/button'

interface ComposerEditorProps {
  value: string
  onChange: (value: string) => void
}

export function ComposerEditor({ value, onChange }: ComposerEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Tulis naskah dinas di sini, gunakan "/" untuk perintah...',
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[400px]',
      },
    },
  })

  if (!editor) {
    return <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-xl" />
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="relative w-full rounded-2xl border border-border/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl shadow-inner-glow overflow-hidden">
      
      {/* Static Toolbar */}
      {editor && (
        <div className="flex flex-wrap items-center gap-1 bg-muted/30 p-2 border-b border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
          >
            H1
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          >
            H2
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full ${editor.isActive('bold') ? 'bg-muted text-primary' : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full ${editor.isActive('italic') ? 'bg-muted text-primary' : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full ${editor.isActive('underline') ? 'bg-muted text-primary' : ''}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-border my-auto mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full ${editor.isActive({ textAlign: 'left' }) ? 'bg-muted text-primary' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full ${editor.isActive({ textAlign: 'center' }) ? 'bg-muted text-primary' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full ${editor.isActive({ textAlign: 'right' }) ? 'bg-muted text-primary' : ''}`}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-border my-auto mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`w-8 h-8 rounded-full ${editor.isActive('link') ? 'bg-muted text-primary' : ''}`}
            onClick={toggleLink}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="p-6 md:p-10 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
