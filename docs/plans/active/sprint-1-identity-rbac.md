# Sprint 1 — Identity and Dynamic RBAC

## Goal

Implement authentication, session management and runtime-configurable permission-based access control.

## Backend scope

- User, Session and RefreshToken database models;
- Role, Permission, UserRole, RolePermission and UserPermission models;
- register, login, refresh-token rotation, logout and logout-all;
- permission decorator and permission guard;
- effective permission resolver with direct ALLOW and DENY;
- Redis authorization cache and invalidation;
- audit records for every privileged access change;
- privilege-escalation and final-super-admin protection;
- OpenAPI contracts and normalized error responses.

## Admin scope

- login page;
- user list and user access detail;
- role list, create and edit forms;
- permission list and create form;
- direct user permission assignment;
- effective permission viewer;
- HeroUI loading, empty, error and confirmation states;
- static UI text through the existing next-intl configuration.

## Important constraints

- Never authorize business endpoints using hard-coded role names.
- Runtime role and permission names are displayed from database values and are not translated.
- Hidden frontend controls are not a security boundary.
