import type { ReactNode } from 'react'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { cn } from '@/utils/cn'
import './AppEditor.scss'

export interface AppEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  disabled?: boolean
}

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      className={cn('app-editor__btn', active && 'app-editor__btn--active')}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/**
 * Shared rich-text editor (TipTap plugin).
 * Works with Ant Design Form via value / onChange.
 */
export function AppEditor({
  value = '',
  onChange,
  placeholder = 'Write content…',
  className,
  minHeight = 220,
  disabled = false,
}: AppEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight,
      Image,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor: current }) => {
      onChange?.(current.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'app-editor__content',
        style: `min-height:${minHeight}px`,
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value || ''
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) return null

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', previous || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className={cn('app-editor', disabled && 'app-editor--disabled', className)}>
      <div className="app-editor__toolbar" role="toolbar" aria-label="Editor toolbar">
        <ToolbarButton
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <i className="fa-solid fa-bold" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i className="fa-solid fa-italic" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <i className="fa-solid fa-underline" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Highlight"
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <i className="fa-solid fa-highlighter" aria-hidden />
        </ToolbarButton>
        <span className="app-editor__sep" />
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          title="Paragraph"
          active={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <i className="fa-solid fa-paragraph" aria-hidden />
        </ToolbarButton>
        <span className="app-editor__sep" />
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <i className="fa-solid fa-list-ul" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Ordered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <i className="fa-solid fa-list-ol" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <i className="fa-solid fa-quote-left" aria-hidden />
        </ToolbarButton>
        <span className="app-editor__sep" />
        <ToolbarButton title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <i className="fa-solid fa-align-left" aria-hidden />
        </ToolbarButton>
        <ToolbarButton title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <i className="fa-solid fa-align-center" aria-hidden />
        </ToolbarButton>
        <ToolbarButton title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <i className="fa-solid fa-align-right" aria-hidden />
        </ToolbarButton>
        <span className="app-editor__sep" />
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <i className="fa-solid fa-link" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <i className="fa-solid fa-rotate-left" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <i className="fa-solid fa-rotate-right" aria-hidden />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
