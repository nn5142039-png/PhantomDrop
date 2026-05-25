import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decryptNote } from '../crypto.js';

export default function ViewNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [encryptedData, setEncryptedData] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [decryptedText, setDecryptedText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState('');
  const [burned, setBurned] = useState(false);
  const [showBurnAnimation, setShowBurnAnimation] = useState(false);

  const fetchAttempted = useRef(false);

  // Fetch encrypted payload on mount
  useEffect(() => {
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    async function fetchSecret() {
      try {
        const res = await fetch(`/api/secret/${id}`);

        if (res.status === 404) {
          setBurned(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to retrieve secret');
        }

        const data = await res.json();
        setEncryptedData(data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve secret');
      } finally {
        setLoading(false);
      }
    }

    fetchSecret();
  }, [id]);

  async function handleDecrypt(e) {
    e.preventDefault();
    if (!passphrase || !encryptedData) return;

    setDecrypting(true);
    setError('');

    try {
      const plaintext = await decryptNote(
        encryptedData.ciphertext,
        encryptedData.iv,
        encryptedData.salt,
        passphrase
      );

      // Show burn animation first
      setShowBurnAnimation(true);

      await new Promise(resolve => setTimeout(resolve, 2000));

      setShowBurnAnimation(false);
      setDecryptedText(plaintext);
    } catch (err) {
      console.error('Decryption failed:', err);
      setError(
        'Decryption failed. Wrong passphrase or the data has been tampered with.'
      );
    } finally {
      setDecrypting(false);
    }
  }

  // Burn animation overlay
  if (showBurnAnimation) {
    return (
      <div className="burn-overlay">
        <div className="burn-animation">
          <div className="burn-animation__icon">🔥</div>
          <div className="burn-animation__text">Burning Evidence</div>
          <div className="burn-animation__subtext">Server record destroyed</div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="card">
        <div className="view-note__status">
          <svg className="view-note__status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" strokeDasharray="4 3" opacity="0.6">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.5" />
          </svg>
          <span className="view-note__status-text">Retrieving encrypted payload...</span>
        </div>
      </div>
    );
  }

  // Already burned / expired
  if (burned) {
    return (
      <div className="card">
        <div className="error-state">
          <svg className="error-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <h2 className="error-state__title">Ghost Protocol</h2>
          <p className="error-state__message">
            This secret has already been read or has expired.
            The data has been permanently destroyed.
          </p>
          <button className="btn btn--primary btn--small" onClick={() => navigate('/')}>
            <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Secret
          </button>
        </div>
      </div>
    );
  }

  // Decrypted content
  if (decryptedText !== null) {
    return (
      <div className="card">
        <div className="card__header">
          <svg className="card__header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 12 15 16 10" />
          </svg>
          <span className="card__header-title">Decrypted Message</span>
        </div>

        <div className="decrypted-note">
          <div className="decrypted-note__warning">
            <span className="decrypted-note__warning-icon">🔥</span>
            <span className="decrypted-note__warning-text">
              This message has been permanently burned from the server
            </span>
          </div>

          <div className="decrypted-note__content">
            {decryptedText}
          </div>
        </div>

        <div className="security-badge">
          <svg className="security-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="security-badge__text">
            Decrypted locally • Server record destroyed
          </span>
        </div>

        <button className="btn btn--secondary new-note-btn" onClick={() => navigate('/')}>
          <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Secret
        </button>
      </div>
    );
  }

  // Passphrase entry form
  return (
    <div className="card">
      <div className="card__header">
        <svg className="card__header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span className="card__header-title">Decrypt Secret</span>
      </div>

      <div className="decrypted-note__warning" style={{ marginBottom: '1.5rem' }}>
        <span className="decrypted-note__warning-icon">⚠</span>
        <span className="decrypted-note__warning-text">
          One-time access • This message will be destroyed after decryption
        </span>
      </div>

      <form onSubmit={handleDecrypt}>
        <div className="form-group">
          <label className="form-group__label" htmlFor="decrypt-passphrase">
            <svg className="form-group__label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            Enter Passphrase
          </label>
          <input
            id="decrypt-passphrase"
            className="input input--password"
            type="password"
            placeholder="Enter the passphrase..."
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>

        {error && (
          <div className="decrypted-note__warning" style={{ marginBottom: '1rem' }}>
            <span className="decrypted-note__warning-icon">✕</span>
            <span className="decrypted-note__warning-text error-state__message--danger">
              {error}
            </span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={!passphrase || decrypting}
        >
          {decrypting ? (
            <>
              <span className="spinner"></span>
              Decrypting...
            </>
          ) : (
            <>
              <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
                <line x1="12" y1="3" x2="12" y2="7" opacity="0" />
              </svg>
              Decrypt & Burn
            </>
          )}
        </button>
      </form>
    </div>
  );
}
