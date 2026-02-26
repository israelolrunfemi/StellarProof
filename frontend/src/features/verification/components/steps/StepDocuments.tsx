'use client';

import { useMemo } from 'react';
import { useWizardStore } from '../../store/wizard.store';
import {
  isValidAssetCode,
  isValidAmount,
} from '@/utils/validation';
import { isValidSHA256 } from '@/utils/validation';

export default function StepDocuments() {
  const { formData, updateFormData, setStepValid } = useWizardStore();

  const documents = formData.documents || {
    assetCode: '',
    amount: '',
    proofHash: '',
  };

  const isValid = useMemo(() => {
    return (
      isValidAssetCode(documents.assetCode) &&
      isValidAmount(documents.amount) &&
      isValidSHA256(documents.proofHash)
    );
  }, [documents]);

  const handleChange = (field: string, value: string) => {
    const updated = {
      ...documents,
      [field]: value,
    };

    updateFormData('documents', updated);

    const valid =
      isValidAssetCode(updated.assetCode) &&
      isValidAmount(updated.amount) &&
      isValidSHA256(updated.proofHash);

    setStepValid(1, valid);
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={documents.assetCode}
        onChange={(e) => handleChange('assetCode', e.target.value)}
        placeholder="Asset Code"
        className="w-full rounded-lg border px-4 py-2"
      />

      <input
        type="number"
        value={documents.amount}
        onChange={(e) => handleChange('amount', e.target.value)}
        placeholder="Amount"
        className="w-full rounded-lg border px-4 py-2"
      />

      <input
        type="text"
        value={documents.proofHash}
        onChange={(e) => handleChange('proofHash', e.target.value)}
        placeholder="SHA256 Proof Hash"
        className="w-full rounded-lg border px-4 py-2"
      />
    </div>
  );
}