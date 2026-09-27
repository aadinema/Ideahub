/**
 * client/src/components/RichTextEditor.jsx
 * Thin wrapper around react-quill with the IdeaHub toolbar preset.
 * Styling lives in index.css (.ql-* overrides).
 */
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'clean'],
  ],
};

const FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link',
];

/**
 * @param {string} value        current HTML
 * @param {(html: string) => void} onChange
 * @param {string} [placeholder]
 * @param {string} [id]
 * @param {string} [ariaLabel] accessible name for the contenteditable region
 */
export default function RichTextEditor({ value, onChange, placeholder, id, ariaLabel = 'Rich text editor' }) {
  return (
    <div id={id} className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={MODULES}
        formats={FORMATS}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}
