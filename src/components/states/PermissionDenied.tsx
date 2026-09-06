import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

export const PermissionDenied: React.FC<{ requiredRole?: string; onSwitchRole?: () => void }> = ({
  requiredRole = 'HQ Admin or Governance Auditor',
  onSwitchRole,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 border border-border rounded-[12px] my-6">
      <div className="w-12 h-12 rounded-full bg-status-warning/10 text-status-warning flex items-center justify-center mb-3">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-ink">Access Restricted — Permission Required</h3>
      <p className="text-xs text-status-neutral max-w-md mt-1.5 leading-relaxed">
        Your current role scope does not have permission to view or execute operations in this module. Access is restricted to <span className="font-semibold text-brand-berry">{requiredRole}</span>.
      </p>
      {onSwitchRole && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onSwitchRole}>
            Switch Role Scope
          </Button>
        </div>
      )}
    </div>
  );
};
