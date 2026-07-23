import React from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ReportGenerator } from '../components/reports/ReportGenerator';

export const ReportsPage: React.FC = () => {
  return (
    <AdminLayout>
      <ReportGenerator />
    </AdminLayout>
  );
};
