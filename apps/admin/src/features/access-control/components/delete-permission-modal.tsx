'use client';

import { Button, Modal, useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { parseApiError } from '@/lib/api/api-error';

import { useDeletePermission } from '../hooks/use-permission-mutations';
import { PermissionListItem } from '../types/permission.types';

type DeletePermissionModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  permission: PermissionListItem | null;
};

export function DeletePermissionModal({
  isOpen,
  onOpenChange,
  permission,
}: DeletePermissionModalProps) {
  const t = useTranslations('AccessControl.permissions.deleteModal');
  const tErrors = useTranslations('Errors');

  const overlayState = useOverlayState({
    isOpen,
    onOpenChange,
  });

  const [error, setError] = useState<string | null>(null);

  const deletePermission = useDeletePermission();

  const handleConfirm = async (): Promise<void> => {
    if (!permission) {
      return;
    }

    setError(null);

    try {
      await deletePermission.mutateAsync(permission.id);
      onOpenChange(false);
    } catch (caughtError: unknown) {
      const apiError = parseApiError(caughtError);

      setError(
        apiError.code && tErrors.has(apiError.code) ? tErrors(apiError.code) : apiError.message,
      );
    }
  };

  return (
    <Modal state={overlayState}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center" size="md">
          <Modal.Dialog aria-label={t('title')}>
            <Modal.CloseTrigger />

            <Modal.Header>
              <Modal.Heading>{t('title')}</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-3">
              <p className="text-sm text-default-600">
                {t('confirmation', { name: permission?.name ?? '' })}
              </p>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                >
                  {error}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                type="button"
                variant="ghost"
                isDisabled={deletePermission.isPending}
                onPress={() => {
                  onOpenChange(false);
                }}
              >
                {t('cancel')}
              </Button>

              <Button
                type="button"
                variant="danger"
                isPending={deletePermission.isPending}
                isDisabled={deletePermission.isPending}
                onPress={() => {
                  void handleConfirm();
                }}
              >
                {t('confirm')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
