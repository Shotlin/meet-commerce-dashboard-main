import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { AuditDiffViewer } from '../components/domain/AuditDiffViewer';
import { PermissionDenied } from '../components/states/PermissionDenied';
import { governanceService } from '../services/governanceService';
import { useAuth } from '../context/AuthContext';
import { isRouteAllowed } from '../utils/permissions';
import { AuditLog } from '../types';
import { Shield } from 'lucide-react';

export const GovernancePage: React.FC = () => {
  const { role, setRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const isAllowed = isRouteAllowed('/governance', role);

  useEffect(() => {
    if (isAllowed) {
      governanceService.getAuditLogs().then(setLogs);
    }
  }, [isAllowed]);

  if (!isAllowed) {
    return <PermissionDenied requiredRole="HQ Admin or Governance Auditor" onSwitchRole={() => setRole('HQ Admin')} />;
  }

  return (
    <div>
      <PageHeader
        title="Governance, RBAC Matrix & System Audit Explorer"
        subtitle="Immutable audit trail of all role actions, state mutations, and access control permissions."
        badge={<Badge variant="brand" icon={<Shield className="w-3.5 h-3.5" />}>Audit Log Active</Badge>}
      />

      <div className="space-y-4">
        {logs.map((log) => (
          <AuditDiffViewer
            key={log.id}
            actor={`${log.actor} (${log.role})`}
            action={log.action}
            timestamp={log.timestamp}
            changes={log.changes}
          />
        ))}
      </div>
    </div>
  );
};
