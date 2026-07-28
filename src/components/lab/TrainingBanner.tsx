'use client';

import { AlertTriangle, Shield } from 'lucide-react';

export function TrainingBanner() {
  return (
    <div className="training-banner" role="alert">
      <AlertTriangle className="w-3.5 h-3.5" />
      <span className="font-bold">⚠️ TRAINING MODE</span>
      <span className="font-normal opacity-80">— This platform contains intentional vulnerabilities for educational purposes. Do not expose to public internet.</span>
      <Shield className="w-3.5 h-3.5 ml-2" />
    </div>
  );
}
