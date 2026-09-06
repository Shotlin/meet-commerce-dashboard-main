import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { FeeSettingsPanel } from '../components/domain/FeeSettingsPanel';
import { PaymentOffersPanel } from '../components/domain/PaymentOffersPanel';
import { PincodeMappingsPanel } from '../components/domain/PincodeMappingsPanel';
import { PaymentGatewayConfigPanel } from '../components/domain/PaymentGatewayConfigPanel';
import { Map, Settings } from 'lucide-react';

export const ConfigurationPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Commerce Configuration & Serviceability Settings"
        subtitle="Fee engine, payment offer rules, and payment gateway settings."
        badge={<Badge variant="brand" icon={<Settings className="w-3.5 h-3.5" />}>Config Live API</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <FeeSettingsPanel />

        <PaymentGatewayConfigPanel />
      </div>

      <div className="mt-4">
        <PaymentOffersPanel />
      </div>

      <div className="mt-4">
        <PincodeMappingsPanel />
      </div>

      <div className="mt-4">
        <Card
          title="Platform API Configuration"
          subtitle="Third-party integration keys — Ola Maps and payment providers."
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-rose-50 flex items-center justify-center shrink-0">
                <Map className="w-4 h-4 text-brand-berry" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Ola Maps API</p>
                <p className="text-[11px] text-status-neutral">
                  Paste, test, and rotate the delivery-address map key — no redeploy needed.
                </p>
              </div>
            </div>
            <Link to="/configuration/maps">
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
