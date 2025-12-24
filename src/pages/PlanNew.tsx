import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PlanNew is now a redirect layer only.
 * All plan creation is handled by /plan/reset.
 */
const PlanNew = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/plan/reset', { replace: true });
  }, [navigate]);

  return null;
};

export default PlanNew;
