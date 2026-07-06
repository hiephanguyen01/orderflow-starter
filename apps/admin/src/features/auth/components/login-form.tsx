'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, FieldError, Form, Input, Label, TextField } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useRouter } from '@/i18n/navigation';
import { parseApiError } from '@/lib/api/api-error';

import { useAuth } from '../hooks/use-auth';
import { createLoginSchema, LoginFormValues } from '../schemas/login.schema';

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('Auth.login');
  const tErrors = useTranslations('Errors');
  const { login } = useAuth();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      createLoginSchema({
        emailRequired: t('validation.emailRequired'),
        emailInvalid: t('validation.emailInvalid'),
        passwordRequired: t('validation.passwordRequired'),
        passwordTooLong: t('validation.passwordTooLong'),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const getTranslatedApiError = (error: unknown): string => {
    const apiError = parseApiError(error);

    if (apiError.code && tErrors.has(apiError.code)) {
      return tErrors(apiError.code);
    }

    if (apiError.statusCode === null) {
      return tErrors('NETWORK_ERROR');
    }

    return apiError.message;
  };

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setSubmitError(null);

    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      });

      router.replace('/admin');
    } catch (error: unknown) {
      const apiError = parseApiError(error);

      for (const [field, message] of Object.entries(apiError.fieldErrors)) {
        if (field === 'email' || field === 'password') {
          setError(field, {
            type: 'server',
            message,
          });
        }
      }

      setSubmitError(getTranslatedApiError(error));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title>{t('title')}</Card.Title>
        <Card.Description>{t('description')}</Card.Description>
      </Card.Header>

      <Card.Content>
        <Form className="flex flex-col gap-5" validationBehavior="aria" onSubmit={handleSubmit(onSubmit)}>
          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {submitError}
            </div>
          )}

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={Boolean(fieldState.error)}
                isRequired
                className="w-full"
              >
                <Label>{t('fields.email')}</Label>

                <Input
                  ref={field.ref}
                  type="email"
                  autoComplete="email"
                  placeholder={t('placeholders.email')}
                  fullWidth
                />

                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isInvalid={Boolean(fieldState.error)}
                isRequired
                className="w-full"
              >
                <Label>{t('fields.password')}</Label>

                <Input
                  ref={field.ref}
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('placeholders.password')}
                  fullWidth
                />

                <FieldError>{fieldState.error?.message}</FieldError>
              </TextField>
            )}
          />

          <Button type="submit" variant="primary" fullWidth isPending={isSubmitting} isDisabled={isSubmitting}>
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </Form>
      </Card.Content>
    </Card>
  );
}
