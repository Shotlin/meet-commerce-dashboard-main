// Basic Component Integrity Validation Suite
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';
import { FilterBar } from '../components/common/FilterBar';

export function runComponentSmokeTests() {
  console.log('Running Component Integrity Smoke Tests...');

  // 1. Button Render Test
  const btnHtml = renderToString(<Button variant="primary">Click Me</Button>);
  if (!btnHtml.includes('Click Me') || !btnHtml.includes('bg-brand-raspberry')) {
    throw new Error('Button component test failed!');
  }

  // 2. Card Render Test
  const cardHtml = renderToString(<Card title="Test Card">Card Content</Card>);
  if (!cardHtml.includes('Test Card') || !cardHtml.includes('Card Content')) {
    throw new Error('Card component test failed!');
  }

  // 3. Badge Render Test
  const badgeHtml = renderToString(<Badge variant="success">Passed</Badge>);
  if (!badgeHtml.includes('Passed') || !badgeHtml.includes('179B73')) {
    throw new Error('Badge component test failed!');
  }

  // 4. Table Render Test
  const tableHtml = renderToString(
    <Table
      columns={[{ header: 'ID', accessorKey: 'id', isMono: true }]}
      data={[{ id: 'REC-101' }]}
      keyExtractor={(r) => r.id}
    />
  );
  if (!tableHtml.includes('REC-101') || !tableHtml.includes('font-mono-num')) {
    throw new Error('Table component test failed!');
  }

  console.log('All Component Smoke Tests Passed Cleanly!');
}

// Execute smoke test immediately on import
runComponentSmokeTests();
