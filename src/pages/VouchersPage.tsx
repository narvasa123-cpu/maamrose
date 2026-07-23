import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { VoucherList } from '../components/vouchers/VoucherList';
import { Modal } from '../components/common/Modal';
import { VoucherForm } from '../components/vouchers/VoucherForm';
import { useVoucher } from '../context/VoucherContext';

export const VouchersPage: React.FC = () => {
  const { addVoucher } = useVoucher();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <AdminLayout onOpenCreateVoucherModal={() => setIsCreateOpen(true)}>
      <VoucherList />

      {/* New Voucher Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Voucher Record"
        subtitle="Physical voucher already exists. Input particulars for tracking."
        maxWidth="2xl"
      >
        <VoucherForm
          onSubmit={(data) => {
            addVoucher(data);
            setIsCreateOpen(false);
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </AdminLayout>
  );
};
