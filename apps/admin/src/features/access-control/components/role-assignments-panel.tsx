'use client';

import {
  Button,
  Card,
  Checkbox,
  Chip,
  Form,
  Label,
  Modal,
  useOverlayState,
} from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { parseApiError } from '@/lib/api/api-error';

import { Can } from './can';
import { useAssignableRoles } from '../hooks/use-users';
import { useReplaceUserRoles } from '../hooks/use-user-access-mutations';
import { UserAccessDetail } from '../types/user-access.types';

type RoleAssignmentsPanelProps = {
  userId: string;
  roles: UserAccessDetail['roles'];
};

export function RoleAssignmentsPanel({ userId, roles }: RoleAssignmentsPanelProps) {
  const t = useTranslations('AccessControl.users.roles');
  const tErrors = useTranslations('Errors');

  const [isOpen, setIsOpen] = useState(false);
  const overlayState = useOverlayState({ isOpen, onOpenChange: setIsOpen });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: assignableRoles = [] } = useAssignableRoles();
  const replaceRoles = useReplaceUserRoles();

  const currentRoleIds = useMemo(() => roles.map(({ role }) => role.id), [roles]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Resetting the form state to the current server data when the dialog
    // opens is a one-time synchronization with the "isOpen" external trigger.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoleIds(currentRoleIds);
    setSubmitError(null);
  }, [isOpen, currentRoleIds]);

  const toggleRole = (roleId: string, selected: boolean): void => {
    setSelectedRoleIds((current) =>
      selected ? [...current, roleId] : current.filter((id) => id !== roleId),
    );
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitError(null);

    try {
      await replaceRoles.mutateAsync({ userId, roleIds: selectedRoleIds });
      setIsOpen(false);
    } catch (error: unknown) {
      const apiError = parseApiError(error);

      setSubmitError(
        apiError.code && tErrors.has(apiError.code) ? tErrors(apiError.code) : apiError.message,
      );
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t('title')}</Card.Title>

        <Can permissions={['users.manage-access', 'roles.assign']} mode="ALL">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              setIsOpen(true);
            }}
          >
            {t('manage')}
          </Button>
        </Can>
      </Card.Header>

      <Card.Content>
        {roles.length === 0 ? (
          <p className="text-sm text-default-500">{t('empty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roles.map(({ role }) => (
              <Chip key={role.id} variant="secondary">
                {role.name}
              </Chip>
            ))}
          </div>
        )}
      </Card.Content>

      <Modal state={overlayState}>
        <Modal.Backdrop variant="blur">
          <Modal.Container placement="center" size="md" scroll="inside">
            <Modal.Dialog aria-label={t('manage')}>
              <Modal.CloseTrigger />

              <Modal.Header>
                <Modal.Heading>{t('manage')}</Modal.Heading>
              </Modal.Header>

              <Form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSubmit();
                }}
                className="contents"
              >
                <Modal.Body className="space-y-3">
                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                    >
                      {submitError}
                    </div>
                  )}

                  {assignableRoles.map((role) => (
                    <Checkbox
                      key={role.id}
                      isSelected={selectedRoleIds.includes(role.id)}
                      onChange={(selected) => {
                        toggleRole(role.id, selected);
                      }}
                    >
                      <Checkbox.Content className="items-start">
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>

                        <Label>
                          <span className="block font-medium">{role.name}</span>
                          <code className="block text-xs text-default-500">{role.code}</code>
                        </Label>
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                </Modal.Body>

                <Modal.Footer>
                  <Button
                    type="button"
                    variant="ghost"
                    isDisabled={replaceRoles.isPending}
                    onPress={() => {
                      setIsOpen(false);
                    }}
                  >
                    {t('cancel')}
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    isPending={replaceRoles.isPending}
                    isDisabled={replaceRoles.isPending}
                  >
                    {t('save')}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
