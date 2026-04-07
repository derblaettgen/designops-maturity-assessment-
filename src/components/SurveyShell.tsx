import type { ReactNode } from 'react';
import { ProgressBar } from './ProgressBar';
import './SurveyShell.css';

interface SurveyShellProps {
  children: ReactNode;
}

export function SurveyShell({ children }: SurveyShellProps) {
  return (
    <>
      <div className="topbar">
        <div className="topbar-logo">adesso</div>
        <div>
          <a href="https://www.adesso.de" target="_blank" rel="noreferrer">
            adesso.de
          </a>
        </div>
      </div>

      <div className="hero">
        <div className="hero-inner">
          <div className="hero-badge">📊 Feldstudie 2026</div>
          <h1>
            DesignOps Reifegrad-Studie:
            <br />
            <span>Status quo in der DACH-Region</span>
          </h1>
          <p>
            Wie professionell organisieren Unternehmen ihre Design-Teams? Diese
            branchenübergreifende Studie erhebt den DesignOps-Reifegrad – inklusive
            Benchmark-Vergleich und ROI-Analyse.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="val">~12</div>
              <div className="lbl">Minuten</div>
            </div>
            <div className="hero-stat">
              <div className="val">9</div>
              <div className="lbl">Abschnitte</div>
            </div>
            <div className="hero-stat">
              <div className="val">100%</div>
              <div className="lbl">Anonym</div>
            </div>
          </div>
        </div>
      </div>

      <ProgressBar />

      {children}

      <div className="footer">
        <div className="footer-logo">adesso</div>
        DesignOps Reifegrad-Studie 2026 · adesso SE · Adessoplatz 1 · 44269 Dortmund
        <br />
        <a
          href="https://www.adesso.de/de/datenschutz/index-4.jsp"
          target="_blank"
          rel="noreferrer"
        >
          Datenschutz
        </a>{' '}
        ·{' '}
        <a
          href="https://www.adesso.de/de/impressum/index.jsp"
          target="_blank"
          rel="noreferrer"
        >
          Impressum
        </a>
      </div>
    </>
  );
}
