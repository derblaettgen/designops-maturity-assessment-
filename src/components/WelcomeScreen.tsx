import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="welcome">
      <div className="welcome__inner">
        <div className="welcome__badge">📊 Feldstudie 2026</div>
        <h1 className="welcome__title">
          DesignOps Reifegrad-Studie:
          <span className="welcome__title-accent"> Status quo in der DACH-Region</span>
        </h1>
        <p className="welcome__description">
          Wie professionell organisieren Unternehmen ihre Design-Teams? Diese
          branchenübergreifende Studie erhebt den DesignOps-Reifegrad – inklusive
          Benchmark-Vergleich und ROI-Analyse.
        </p>

        <div className="welcome__features">
          <div className="welcome__feature">
            <span className="welcome__feature-icon">⏱</span>
            <div>
              <div className="welcome__feature-value">~12 Minuten</div>
              <div className="welcome__feature-label">Geschätzte Dauer</div>
            </div>
          </div>
          <div className="welcome__feature">
            <span className="welcome__feature-icon">📋</span>
            <div>
              <div className="welcome__feature-value">9 Abschnitte</div>
              <div className="welcome__feature-label">Umfassende Bewertung</div>
            </div>
          </div>
          <div className="welcome__feature">
            <span className="welcome__feature-icon">🔒</span>
            <div>
              <div className="welcome__feature-value">100% Anonym</div>
              <div className="welcome__feature-label">Ihre Daten sind sicher</div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary welcome__start" type="button" onClick={onStart}>
          Jetzt starten →
        </button>

        <p className="welcome__privacy">
          Alle Angaben sind freiwillig und werden anonymisiert ausgewertet.{' '}
          <a href="https://www.adesso.de/de/datenschutz/index-4.jsp" target="_blank" rel="noreferrer">
            Datenschutz
          </a>
        </p>
      </div>
    </div>
  );
}
