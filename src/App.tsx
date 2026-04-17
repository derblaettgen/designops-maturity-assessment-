import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SurveyShell } from './components/SurveyShell';
import { SurveyPage } from './pages/SurveyPage';
import { ResultPage } from './pages/ResultPage';

export function App() {
  return (
    <BrowserRouter basename="/survey">
      <SurveyShell>
        <Routes>
          <Route path="/" element={<SurveyPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
        </Routes>
      </SurveyShell>
    </BrowserRouter>
  );
}
