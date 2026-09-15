import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';
import './styles.css';

export default function App() {
  const [userInput, setUserInput] = useState('user-1');
  const [activeUser, setActiveUser] = useState('user-1');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    async function loadDocuments() {
      setIsLoading(true);
      setListError('');

      try {
        const loadedDocuments = await listDocuments(activeUser);
        if (!shouldIgnore) setDocuments(loadedDocuments);
      } catch (error) {
        if (!shouldIgnore) {
          setDocuments([]);
          setListError(error.message);
        }
      } finally {
        if (!shouldIgnore) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => {
      shouldIgnore = true;
    };
  }, [activeUser, reloadKey]);

  function handleUserSubmit(event) {
    event.preventDefault();
    const normalizedUser = userInput.trim();
    if (normalizedUser) setActiveUser(normalizedUser);
  }

  function handleUploaded(document) {
    setDocuments((currentDocuments) => [document, ...currentDocuments]);
    setListError('');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#top" aria-label="Arquivo DMS">
          <span className="brand-mark">A</span>
          <span>Arquivo</span>
        </a>

        <form className="user-form" onSubmit={handleUserSubmit}>
          <label htmlFor="user-id">Usuário</label>
          <input
            id="user-id"
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            maxLength={100}
            required
          />
          <button type="submit" disabled={!userInput.trim()}>Acessar</button>
        </form>
      </header>

      <main id="top">
        <section className="intro">
          <p className="eyebrow">Gestão documental</p>
          <h1>Documentos em ordem.<br />Trabalho em movimento.</h1>
          <p className="intro-copy">
            Área de <strong>{activeUser}</strong>
          </p>
        </section>

        <div className="workspace-grid">
          <UploadComponent userId={activeUser} onUploaded={handleUploaded} />
          <DocumentList
            documents={documents}
            userId={activeUser}
            isLoading={isLoading}
            error={listError}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        </div>
      </main>
    </div>
  );
}
