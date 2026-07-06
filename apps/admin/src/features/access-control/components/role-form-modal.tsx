'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Switch,
  TextField,
  useOverlayState,
} from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { parseApiError } from '@/lib/api/api-error';

import { useCreateRole, useUpdateRole } from '../hooks/use-role-mutations';
import { useAssignablePermissions } from '../hooks/use-roles';
import { createRoleSchema, RoleFormValues } from '../schemas/role.schema';
import { RoleDetail } from '../types/role.types';
import { PermissionSelector } from './permission-selector';

type RoleFormModalProps = {
  isOpen: boolean;
  role: RoleDetail | null;
  onOpenChange: (isOpen: boolean) => void;
};

export function RoleFormModal({ isOpen, onOpenChange, role }: RoleFormModalProps) {
  const t = useTranslations('AccessControl.roles.form');
  const tErrors = useTranslations('Errors');

  const isEditMode = role !== null;
  const isSuperAdmin = role?.code === 'SUPER_ADMIN';

  const overlayState = useOverlayState({
    isOpen,
    onOpenChange,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: assignablePermissions = [] } = useAssignablePermissions(isOpen);

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const isSubmitting = createRole.isPending || updateRole.isPending;

  const schema = useMemo(
    () =>
      createRoleSchema({
        codeRequired: t('validation.codeRequired'),
        codeInvalid: t('validation.codeInvalid'),
        nameRequired: t('validation.nameRequired'),
        nameTooLong: t('validation.nameTooLong'),
        descriptionTooLong: t('validation.descriptionTooLong'),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      isActive: true,
      permissionIds: [],
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      code: role?.code ?? '',
      name: role?.name ?? '',
      description: role?.description ?? '',
      isActive: role?.isActive ?? true,
      permissionIds: role?.permissions.map(({ id }) => id) ?? [],
    });

    // Resetting the banner from a previous submission when the dialog re-opens
    // is a one-time synchronization with the "isOpen" external trigger, not a
    // derived-state loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubmitError(null);
  }, [isOpen, role, reset]);

  const getTranslatedApiError = (error: unknown): string => {
    const apiError = parseApiError(error);

    if (apiError.code && tErrors.has(apiError.code)) {
      return tErrors(apiError.code);
    }

    return apiError.message;
  };

  const onSubmit = async (values: RoleFormValues): Promise<void> => {
    setSubmitError(null);

    try {
      if (isEditMode) {
        await updateRole.mutateAsync({
          roleId: role.id,
          data: {
            name: values.name.trim(),
            description: values.description.trim() || null,
            isActive: values.isActive,
            permissionIds: values.permissionIds,
          },
        });
      } else {
        await createRole.mutateAsync({
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          permissionIds: values.permissionIds,
        });
      }

      onOpenChange(false);
    } catch (error: unknown) {
      setSubmitError(getTranslatedApiError(error));
    }
  };

  return (
    <Modal state={overlayState}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center" size="lg" scroll="inside">
          <Modal.Dialog aria-label={isEditMode ? t('editTitle') : t('createTitle')}>
            <Modal.CloseTrigger />

            <Modal.Header>
              <Modal.Heading>{isEditMode ? t('editTitle') : t('createTitle')}</Modal.Heading>
            </Modal.Header>

            {/* display:contents keeps this <form> out of the flex layout chain so
                Modal.Body/Modal.Footer still size correctly against Modal.Dialog's
                scroll="inside" height constraint. */}
            <Form onSubmit={handleSubmit(onSubmit)} className="contents">
              <Modal.Body className="space-y-5">
                {submitError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                  >
                    {submitError}
                  </div>
                )}

                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(errors.code)}
                      isDisabled={isEditMode}
                      isRequired
                      className="w-full"
                    >
                      <Label>{t('fields.code')}</Label>
                      <Input ref={field.ref} placeholder={t('placeholders.code')} fullWidth />
                      <FieldError>{errors.code?.message}</FieldError>
                    </TextField>
                  )}
                />

                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(errors.name)}
                      isRequired
                      className="w-full"
                    >
                      <Label>{t('fields.name')}</Label>
                      <Input ref={field.ref} placeholder={t('placeholders.name')} fullWidth />
                      <FieldError>{errors.name?.message}</FieldError>
                    </TextField>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      isInvalid={Boolean(errors.description)}
                      className="w-full"
                    >
                      <Label>{t('fields.description')}</Label>
                      <Input
                        ref={field.ref}
                        placeholder={t('placeholders.description')}
                        fullWidth
                      />
                      <FieldError>{errors.description?.message}</FieldError>
                    </TextField>
                  )}
                />

                {isEditMode && (
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        isSelected={field.value}
                        onChange={field.onChange}
                        isDisabled={role?.isSystem}
                      >
                        <Switch.Content>
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                          <Label>{t('fields.isActive')}</Label>
                        </Switch.Content>
                      </Switch>
                    )}
                  />
                )}

                <div>
                  <Label>{t('fields.permissions')}</Label>

                  {isSuperAdmin && (
                    <p className="mb-2 text-xs text-default-500">{t('superAdminPermissionsNote')}</p>
                  )}

                  <Controller
                    name="permissionIds"
                    control={control}
                    render={({ field }) => (
                      <PermissionSelector
                        permissions={assignablePermissions}
                        selectedPermissionIds={field.value}
                        onChange={field.onChange}
                        isDisabled={isSuperAdmin}
                      />
                    )}
                  />
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  type="button"
                  variant="ghost"
                  isDisabled={isSubmitting}
                  onPress={() => {
                    onOpenChange(false);
                  }}
                >
                  {t('cancel')}
                </Button>

                <Button type="submit" variant="primary" isPending={isSubmitting} isDisabled={isSubmitting}>
                  {isEditMode ? t('save') : t('create')}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
