import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ userId, onUploaded }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Selecione um arquivo para enviar.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const document = await uploadDocument(selectedFile, userId);
      setSelectedFile(null);
      inputRef.current.value = '';
      setMessage({ type: 'success', text: 'Documento enviado com sucesso.' });
      onUploaded(document);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Novo documento</span>
          <h2 id="upload-title">Enviar arquivo</h2>
        </div>
        <span className="step-marker" aria-hidden="true">01</span>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker" htmlFor="document-file">
          <span className="file-picker-label">
            {selectedFile ? selectedFile.name : 'Selecionar arquivo'}
          </span>
          <span className="file-picker-meta">
            {selectedFile
              ? `${(selectedFile.size / 1024).toFixed(1)} KB`
              : 'PDF, texto ou formato permitido'}
          </span>
        </label>
        <input
          ref={inputRef}
          id="document-file"
          className="visually-hidden"
          type="file"
          onChange={(event) => {
            setSelectedFile(event.target.files[0] || null);
            setMessage(null);
          }}
          disabled={isUploading}
        />

        <button
          className="primary-button"
          type="submit"
          disabled={isUploading || !userId}
        >
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>

      {message && (
        <p className={`status-message ${message.type}`} role="status">
          {message.text}
        </p>
      )}
    </section>
  );
}