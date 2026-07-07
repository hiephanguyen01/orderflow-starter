'use client';

import { Card, Chip, Table } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { UserAccessDetail } from '../types/user-access.types';

type EffectivePermissionsPanelProps = {
  permissionBreakdown: UserAccessDetail['permissionBreakdown'];
};

export function EffectivePermissionsPanel({
  permissionBreakdown,
}: EffectivePermissionsPanelProps) {
  const t = useTranslations('AccessControl.users.effectivePermissions');

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t('title')}</Card.Title>
        <Card.Description>{t('description')}</Card.Description>
      </Card.Header>

      <Card.Content>
        <div className="overflow-hidden rounded-2xl">
          <Table>
            <Table.Content aria-label={t('tableLabel')}>
              <Table.Header>
                <Table.Column isRowHeader>{t('columns.permission')}</Table.Column>
                <Table.Column>{t('columns.source')}</Table.Column>
                <Table.Column>{t('columns.directEffect')}</Table.Column>
                <Table.Column>{t('columns.effective')}</Table.Column>
              </Table.Header>

              <Table.Body renderEmptyState={() => t('empty')}>
                {permissionBreakdown.map((item) => (
                  <Table.Row key={item.permission.id} id={item.permission.id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium">{item.permission.name}</p>
                        <code className="text-xs text-default-500">{item.permission.code}</code>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      {item.roleSources.length === 0 ? (
                        <span className="text-xs text-default-400">{t('noRoleSource')}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.roleSources.map((source) => (
                            <Chip key={source.roleId} variant="secondary">
                              {source.roleName}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </Table.Cell>

                    <Table.Cell>
                      {item.directEffect ? (
                        <Chip color={item.directEffect === 'ALLOW' ? 'success' : 'danger'} variant="soft">
                          {t(`effect.${item.directEffect}`)}
                        </Chip>
                      ) : (
                        <span className="text-xs text-default-400">{t('effect.NONE')}</span>
                      )}
                    </Table.Cell>

                    <Table.Cell>
                      <Chip color={item.isEffective ? 'success' : 'default'} variant="soft">
                        {item.isEffective ? t('effectiveYes') : t('effectiveNo')}
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table>
        </div>
      </Card.Content>
    </Card>
  );
}
