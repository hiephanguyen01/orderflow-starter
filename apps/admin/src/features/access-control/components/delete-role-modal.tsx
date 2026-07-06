'use client';

import { Button, Modal, useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { parseApiError } from '@/lib/api/api-error';

import { useDeleteRole } from '../hooks/use-role-mutations';
import { RoleListItem } from '../types/role.types';

type DeleteRoleModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  role: RoleListItem | null;
};

export function DeleteRoleModal({ isOpen, onOpenChange, role }: DeleteRoleModalProps) {
  const t = useTranslations('AccessControl.roles.deleteModal');
  const tErrors = useTranslations('Errors');

  const overlayState = useOverlayState({
    isOpen,
    onOpenChange,
  });

  const [error, setError] = useState<string | null>(null);

  const deleteRole = useDeleteRole();

  const handleConfirm = async (): Promise<void> => {
    if (!role) {
      return;
    }

    setError(null);

    try {
      await deleteRole.mutateAsync(role.id);
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
                {t('confirmation', { name: role?.name ?? '' })}
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
                isDisabled={deleteRole.isPending}
                onPress={() => {
                  onOpenChange(false);
                }}
              >
                {t('cancel')}
              </Button>

              <Button
                type="button"
                variant="danger"
                isPending={deleteRole.isPending}
                isDisabled={deleteRole.isPending}
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
