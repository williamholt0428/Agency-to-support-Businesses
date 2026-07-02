import React from 'react';

const StatusBanner = ({ health }) => {
  if (!health) return null;

  const isHealthy = health.status === 'ok';
  const aiOk = health.components?.ai_service?.status === 'ok';
  const emailConfigured = health.components?.email?.status === 'configured';

  let message = 'All systems operational.';
  let color = 'bg-green-500';

  if (!isHealthy) {
    color = 'bg-yellow-500';
    message = 'Some features limited. ';
    if (!aiOk) message += 'AI personalization using mock mode. ';
    if (!emailConfigured) message += 'Emails using mock mode. ';
    message += 'Check configuration for production use.';
  }

  return (
    <div className={`rounded-lg p-3 mb-6 text-sm flex items-center gap-2 ${isHealthy ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span>{message}</span>
      {!isHealthy && (
        <a href="#config" className="ml-auto underline text-xs hover:no-underline">
          Configure →
        </a>
      )}
    </div>
  );
};

export default StatusBanner;
