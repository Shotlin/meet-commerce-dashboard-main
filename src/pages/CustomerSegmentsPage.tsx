import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { CustomerSegmentsPanel } from '../components/domain/CustomerSegmentsPanel';

export const CustomerSegmentsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Customer Segments"
        subtitle="Group customers to target with coupons and notifications"
      />
      <CustomerSegmentsPanel />
    </div>
  );
};
