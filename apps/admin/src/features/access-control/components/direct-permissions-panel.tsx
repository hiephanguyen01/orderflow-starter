'use client';

import { Button, Card, Chip, Form, Modal, SearchField, useOverlayState } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { parseApiError } from '@/lib/api/api-error';

import { Can } from './can';
import { useAssignableUserPermissions } from '../hooks/use-users';
import { useReplaceUserPermissions } from '../hooks/use-user-access-mutations';
import { groupPermissions } from '../utils/group-permissions';
import { DirectPermissionEffect, UserAccessDetail } from '../types/user-access.types';

type DirectPermissionsPanelProps = {
  userId: string;
  directPermissions: UserAccessDetail['directPermissions'];
  isSuperAdminTarget: boolean;
};

export function DirectPermissionsPanel({
  userId,
  directPermissions,
  isSuperAdminTarget,
}: DirectPermissionsPanelProps) {
  const t = useTranslations('AccessControl.users.directPermissions');
  const tErrors = useTranslations('Errors');

  const [isOpen, setIsOpen] = useState(false);
  const overlayState = useOverlayState({ isOpen, onOpenChange: setIsOpen });

  const [search, setSearch] = useState('');
  const [effects, setEffects] = useState<Record<string, DirectPermissionEffect | undefined>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: assignablePermissions = [] } = useAssignableUserPermissions();
  const replacePermissions = useReplaceUserPermissions();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Resetting the form state to the current server data when the dialog
    // opens is a one-time synchronization with the "isOpen" external trigger.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEffects(
      Object.fromEntries(
        directPermissions.map(({ permission, effect }) => [permission.id, effect]),
      ),
    );

    setSubmitError(null);
  }, [isOpen, directPermissions]);

  const filteredPermissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return assignablePermissions;
    }

    return assignablePermissions.filter(
      (permission) =>
        permission.code.toLowerCase().includes(normalizedSearch) ||
        permission.name.toLowerCase().includes(normalizedSearch) ||
        permission.module.toLowerCase().includes(normalizedSearch),
    );
  }, [assignablePermissions, search]);

  const groups = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions]);

  const setEffect = (permissionId: string, effect: DirectPermissionEffect | undefined): void => {
    setEffects((current) => ({ ...current, [permissionId]: effect }));
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitError(null);

    const permissions = Object.entries(effects)
      .filter((entry): entry is [string, DirectPermissionEffect] => Boolean(entry[1]))
      .map(([permissionId, effect]) => ({ permissionId, effect }));

    try {
      await replacePermissions.mutateAsync({ userId, permissions });
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

        {!isSuperAdminTarget && (
          <Can permissions={['users.manage-access', 'permissions.assign']} mode="ALL">
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
        )}
      </Card.Header>

      <Card.Content>
        {isSuperAdminTarget ? (
          <p className="text-sm text-default-500">{t('superAdminNotice')}</p>
        ) : directPermissions.length === 0 ? (
          <p className="text-sm text-default-500">{t('empty')}</p>
        ) : (
          <div className="space-y-2">
            {directPermissions.map(({ permission, effect }) => (
              <div key={permission.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{permission.name}</p>
                  <code className="text-xs text-default-500">{permission.code}</code>
                </div>

                <Chip color={effect === 'ALLOW' ? 'success' : 'danger'} variant="soft">
                  {t(`effect.${effect}`)}
                </Chip>
              </div>
            ))}
          </div>
        )}
      </Card.Content>

      <Modal state={overlayState}>
        <Modal.Backdrop variant="blur">
          <Modal.Container placement="center" size="lg" scroll="inside">
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
                <Modal.Body className="space-y-4">
                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                    >
                      {submitError}
                    </div>
                  )}

                  <SearchField value={search} onChange={setSearch} aria-label={t('searchLabel')}>
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder={t('searchPlaceholder')} />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>

                  <div className="max-h-[24rem] space-y-4 overflow-y-auto rounded-xl border border-default-200 p-4">
                    {groups.map((group) => (
                      <section key={group.module} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-default-400">
                          {group.module}
                        </p>

                        {group.permissions.map((permission) => {
                          const effect = effects[permission.id];

                          return (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-default-50 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium">{permission.name}</p>
                                <code className="text-xs text-default-500">
                                  {permission.code}
                                </code>
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={effect === undefined ? 'primary' : 'ghost'}
                                  onPress={() => {
                                    setEffect(permission.id, undefined);
                                  }}
                                >
                                  {t('effect.NONE')}
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant={effect === 'ALLOW' ? 'primary' : 'ghost'}
                                  onPress={() => {
                                    setEffect(permission.id, 'ALLOW');
                                  }}
                                >
                                  {t('effect.ALLOW')}
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant={effect === 'DENY' ? 'danger' : 'ghost'}
                                  onPress={() => {
                                    setEffect(permission.id, 'DENY');
                                  }}
                                >
                                  {t('effect.DENY')}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </section>
                    ))}
                  </div>
                </Modal.Body>

                <Modal.Footer>
                  <Button
                    type="button"
                    variant="ghost"
                    isDisabled={replacePermissions.isPending}
                    onPress={() => {
                      setIsOpen(false);
                    }}
                  >
                    {t('cancel')}
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    isPending={replacePermissions.isPending}
                    isDisabled={replacePermissions.isPending}
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
