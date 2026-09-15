import DownloadButton from './DownloadButton.jsx';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DocumentList({ documents, userId, isLoading, error, onRetry }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title">
      <div className="section-heading list-heading">
        <div>
          <span className="eyebrow">Biblioteca</span>
          <h2 id="documents-title">Seus documentos</h2>
        </div>
        <span className="document-count">
          {documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}
        </span>
      </div>

      {isLoading && <p className="empty-state" role="status">Carregando documentos...</p>}

      {!isLoading && error && (
        <div className="empty-state error-state" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoading && !error && documents.length === 0 && (
        <p className="empty-state">Nenhum documento encontrado.</p>
      )}

      {!isLoading && !error && documents.length > 0 && (
        <div className="document-list">
          {documents.map((document) => (
            <article className="document-row" key={document.id}>
              <div className="file-mark" aria-hidden="true">
                {document.originalName.split('.').pop().slice(0, 4).toUpperCase()}
              </div>
              <div className="document-details">
                <h3>{document.originalName}</h3>
                <p>
                  <span>{formatFileSize(document.size)}</span>
                  <span>{formatDate(document.uploadedAt)}</span>
                  <span>{document.mimeType}</span>
                </p>
              </div>
              <DownloadButton document={document} userId={userId} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}