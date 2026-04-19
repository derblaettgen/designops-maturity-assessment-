import type { ReactNode } from 'react';
import './SurveyShell.css';

interface SurveyShellProps {
  children: ReactNode;
}

export function SurveyShell({ children }: SurveyShellProps) {
  return (
    <>
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
