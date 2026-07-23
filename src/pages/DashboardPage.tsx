import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { Modal } from '../components/common/Modal';
import { VoucherForm } from '../components/vouchers/VoucherForm';
import { useVoucher } from '../context/VoucherContext';

export const DashboardPage: React.FC = () => {
  const { addVoucher } = useVoucher();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateSubmit = (data: any) => {
    addVoucher(data);
    setIsCreateOpen(false);
  };

  return (
    <AdminLayout onOpenCreateVoucherModal={() => setIsCreateOpen(true)}>
      <DashboardOverview onOpenCreateVoucher={() => setIsCreateOpen(true)} />

      {/* New Voucher Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Voucher Record"
        subtitle="Physical voucher already exists. Input particulars for tracking."
        maxWidth="2xl"
      >
        <VoucherForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </AdminLayout>
  );
};
