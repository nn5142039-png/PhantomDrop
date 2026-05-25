export default function Header() {
  return (
    <header className="header">
      <div className="header__logo">
        <div className="header__icon">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="#ff2d2d" strokeWidth="2" strokeDasharray="4 3" opacity="0.6"/>
            <circle cx="24" cy="24" r="12" stroke="#ff2d2d" strokeWidth="1.5" opacity="0.8"/>
            <circle cx="24" cy="24" r="4" fill="#ff2d2d"/>
            <line x1="24" y1="2" x2="24" y2="10" stroke="#ff2d2d" strokeWidth="1" opacity="0.5"/>
            <line x1="24" y1="38" x2="24" y2="46" stroke="#ff2d2d" strokeWidth="1" opacity="0.5"/>
            <line x1="2" y1="24" x2="10" y2="24" stroke="#ff2d2d" strokeWidth="1" opacity="0.5"/>
            <line x1="38" y1="24" x2="46" y2="24" stroke="#ff2d2d" strokeWidth="1" opacity="0.5"/>
          </svg>
        </div>
        <h1 className="header__title" data-text="Phantom Drop">
          Phantom Drop
        </h1>
      </div>
      <p className="header__subtitle">Zero-Knowledge Encrypted Messaging</p>
      <p className="header__tagline">&#9888; Your message will self-destruct &#9888;</p>

      <div className="classification-bar">
        <span className="classification-bar__dot"></span>
        <span className="classification-bar__text">Classified • End-to-End Encrypted • Burn After Reading</span>
        <span className="classification-bar__dot"></span>
      </div>
    </header>
  );
}
