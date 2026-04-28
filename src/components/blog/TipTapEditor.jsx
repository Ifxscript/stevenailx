import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { uploadToImgBB } from '../../lib/imgbb';
import { 
  Bold, Italic, Heading1, Heading2, Heading3,
  Quote, List, ListOrdered, ImagePlus, Loader2
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import './TipTapEditor.css';

function ToolbarButton({ onClick, isActive, icon: Icon, label, disabled }) {
  return (
    <button
      type="button"
      className={`tte-toolbar-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <Icon size={18} />
    </button>
  );
}

function TipTapEditor({ content, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: content || '<p>Start writing your article...</p>',
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="tte-wrapper">
      {/* Toolbar */}
      <div className="tte-toolbar">
        <div className="tte-toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            icon={Heading1}
            label="Heading 1"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            icon={Heading2}
            label="Heading 2"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            icon={Heading3}
            label="Heading 3"
          />
        </div>

        <div className="tte-toolbar-divider" />

        <div className="tte-toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={Bold}
            label="Bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={Italic}
            label="Italic"
          />
        </div>

        <div className="tte-toolbar-divider" />

        <div className="tte-toolbar-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            icon={Quote}
            label="Blockquote"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={List}
            label="Bullet List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={ListOrdered}
            label="Numbered List"
          />
        </div>

        <div className="tte-toolbar-divider" />

        <div className="tte-toolbar-group">
          <button
            type="button"
            className="tte-toolbar-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Insert Image"
            aria-label="Insert Image"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="tte-content-area">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default TipTapEditor;
