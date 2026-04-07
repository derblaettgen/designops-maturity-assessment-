import { useState } from 'react';
import { SurveyShell } from './components/SurveyShell';
import { StepView } from './components/StepView';
import { DashboardView } from './dashboard/DashboardView';

export function App() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <SurveyShell>
      {isSubmitted ? <DashboardView /> : <StepView onSubmit={() => setIsSubmitted(true)} />}
    </SurveyShell>
  );
}
