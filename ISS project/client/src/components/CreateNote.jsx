import { useState } from 'react';
import { encryptNote } from '../crypto.js';



export default function CreateNote() {
  const [note, setNote] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [ttl, setTtl] = useState(3600);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = note.trim().length > 0 && passphrase.length >= 4;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      // Phase 1: Encrypt client-side
      const encrypted = await encryptNote(note, passphrase);

      // Phase 2: Upload encrypted payload
      const res = await fetch('/api/secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
          ttl: ttl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server error');
      }

      const data = await res.json();
      const link = `${window.location.origin}/note/${data.id}`;
      
      setResult({ link, expiresIn: data.expiresIn });
      setNote('');
      setPassphrase('');
    } catch (err) {
      setError(err.message || 'Encryption or upload failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.getElementById('link-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  function formatTTL(seconds) {
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour(s)`;
    return `${Math.floor(seconds / 86400)} day(s)`;
  }

  function handleReset() {
    setResult(null);
    setCopied(false);
    setError('');
  }

  // Show success state
  if (result) {
    return (
      <div className="card">
        <div className="card__header">
          <svg className="card__header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="card__header-title">Secret Deployed</span>
        </div>

        <div className="success-section">
          <div className="success-section__banner">
            <span className="success-section__banner-icon">✓</span>
            <span className="success-section__banner-text">
              Encrypted & stored. Share this link securely.
            </span>
          </div>

          <div className="link-box">
            <input
              id="link-input"
              className="link-box__input"
              value={result.link}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button
              className={`link-box__copy ${copied ? 'link-box__copy--copied' : ''}`}
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              )}
            </button>
          </div>

          <div className="expiry-info">
            <svg className="expiry-info__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Self-destructs after first read or {formatTTL(result.expiresIn)}</span>
          </div>
        </div>

        <div className="security-badge">
          <svg className="security-badge__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="security-badge__text">
            AES-256-GCM • PBKDF2-SHA256 • Zero-Knowledge
          </span>
        </div>

        <button className="btn btn--secondary new-note-btn" onClick={handleReset}>
          <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Another
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card__header">
        <svg className="card__header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span className="card__header-title">Compose Secret</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-group__label" htmlFor="note-input">
            <svg className="form-group__label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            Secret Message
          </label>
          <textarea
            id="note-input"
            className="textarea"
            placeholder="Enter your classified message here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={50000}
          />
        </div>

        <div className="form-group">
          <label className="form-group__label" htmlFor="passphrase-input">
            <svg className="form-group__label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            Passphrase (min. 4 chars)
          </label>
          <input
            id="passphrase-input"
            className="input input--password"
            type="password"
            placeholder="••••••••••"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label className="form-group__label">
            <svg className="form-group__label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Time-To-Live
          </label>
          <div className="ttl-slider-container">
            <input
              type="range"
              className="ttl-slider"
              min="1"
              max="1440"
              step="1"
              value={ttl / 60}
              onChange={(e) => setTtl(parseInt(e.target.value, 10) * 60)}
            />
            <div className="ttl-slider-label">
              {formatTTL(ttl)}
            </div>
          </div>
        </div>

        {error && (
          <div className="decrypted-note__warning" style={{ marginBottom: '1rem' }}>
            <span className="decrypted-note__warning-icon">⚠</span>
            <span className="decrypted-note__warning-text">{error}</span>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn--primary"
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Encrypting & Deploying...
            </>
          ) : (
            <>
              <svg className="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Encrypt & Deploy
            </>
          )}
        </button>
      </form>

      <div className="how-it-works">
        <h3 className="how-it-works__title">How It Works</h3>
        <div className="how-it-works__steps">
          <div className="how-it-works__step">
            <span className="how-it-works__step-number">1</span>
            <span className="how-it-works__step-text">
              Your browser derives an encryption key from your passphrase using <strong>PBKDF2-SHA256</strong> (600K iterations).
            </span>
          </div>
          <div className="how-it-works__step">
            <span className="how-it-works__step-number">2</span>
            <span className="how-it-works__step-text">
              The note is encrypted with <strong>AES-256-GCM</strong> — the key never leaves your device.
            </span>
          </div>
          <div className="how-it-works__step">
            <span className="how-it-works__step-number">3</span>
            <span className="how-it-works__step-text">
              Only the ciphertext is sent to our server. Share the link + passphrase separately.
            </span>
          </div>
          <div className="how-it-works__step">
            <span className="how-it-works__step-number">4</span>
            <span className="how-it-works__step-text">
              The note <strong>self-destructs</strong> after first read or when the TTL expires.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
