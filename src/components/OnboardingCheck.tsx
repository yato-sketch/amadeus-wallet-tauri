import { Navigate, useLocation } from 'react-router-dom';

const OnboardingCheck = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isLoading = false;
  const isProfileComplete = false;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isProfileComplete && location.pathname !== '/onboarding/walkthrough') {
    return <Navigate to="/onboarding/walkthrough" state={{ from: location }} replace />;
  }

  return children;
};

export default OnboardingCheck;
