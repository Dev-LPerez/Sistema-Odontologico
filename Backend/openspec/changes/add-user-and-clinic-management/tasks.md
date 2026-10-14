# Tasks

## 1. Capa domain de identity (Extensión para usuarios y consultorio)

- [x] 1.1 Escribir las pruebas unitarias en rojo para los métodos de actualización de perfil en `user.entity.spec.ts` y validación de nombre no vacío en `clinic.entity.spec.ts`.
- [x] 1.2 Implementar los errores de dominio tipados `DuplicateUserEmailError`, `CannotDeactivateSelfError` e `InvalidClinicNameError` en `identity.errors.ts`, extender las entidades `User` y `Clinic`, y agregar `findAllByClinicId(clinicId: string): Promise<User[]>` a `user.repository.port.ts`.
- [x] 1.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/identity/domain && git commit -m "feat(identity): extender entidades User y Clinic con validaciones y puerto de consulta"`


## 2. Capa application de identity (Casos de uso y queries de usuarios y consultorio)

- [x] 2.1 Escribir las pruebas unitarias en rojo para `create-user.use-case.spec.ts`, `update-user.use-case.spec.ts`, `change-user-status.use-case.spec.ts`, `list-clinic-users.query.spec.ts`, `get-clinic-profile.query.spec.ts` y `update-clinic-profile.use-case.spec.ts` usando dobles en memoria y reloj determinista.
- [x] 2.2 Implementar los casos de uso y queries en `application` respetando un único método `execute` por clase (RC-015):
  - `CreateUserUseCase`: valida unicidad de correo, hashea contraseña con `PasswordHasherPort` y persiste usuario.
  - `UpdateUserUseCase`: actualiza perfil, validando colisión de correo si cambia, y opcionalmente nueva contraseña.
  - `ChangeUserStatusUseCase`: impide auto-desactivación (`CannotDeactivateSelfError`) y orquesta dentro de `UnitOfWorkPort` la actualización y revocación de sesiones (`refreshSessionRepo.revokeAllForUser`).
  - `ListClinicUsersQuery`: retorna los usuarios del `clinicId` sin exponer `passwordHash`.
  - `GetClinicProfileQuery`: consulta los datos del consultorio autenticado.
  - `UpdateClinicProfileUseCase`: actualiza nombre, contacto y `settings` JSON del consultorio autenticado.
- [x] 2.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/identity/application && git commit -m "feat(identity): implementar casos de uso y queries para gestion de usuarios y consultorio"`


## 3. Capa infrastructure y actualización de pruebas de contrato (RC-018)

- [x] 3.1 Implementar `findAllByClinicId` en `in-memory-user.repository.ts` y en `prisma-user.repository.ts`.
- [x] 3.2 Extender la suite de contrato `identity-repositories.contract.spec.ts` para verificar `findAllByClinicId` garantizando aislamiento multitenant por `clinicId` (RNF-B-032, RC-018).
- [x] 3.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/identity/infrastructure && git commit -m "feat(identity): actualizar repositorios User con findAllByClinicId y pruebas de contrato"`


## 4. Capa presentation, controladores y pruebas E2E (RC-005)

- [x] 4.1 Definir los DTOs con `class-validator` y `@nestjs/swagger` (`create-user.dto.ts`, `update-user.dto.ts`, `change-user-status.dto.ts`, `update-clinic.dto.ts`, `clinic-profile.dto.ts`).
- [x] 4.2 Implementar `users.controller.ts` (`/v1/users`, protegido con `@UseGuards(JwtAuthGuard, RolesGuard)` y `@Roles('ADMIN')`) y `clinic.controller.ts` (`GET /v1/clinic` para `ADMIN` y `AUXILIARY`; `PATCH /v1/clinic` para `ADMIN`), y registrarlos en `identity.module.ts`.
- [x] 4.3 Escribir y ejecutar la suite E2E `Backend/test/users-and-clinic.e2e-spec.ts` probando creación de usuario, colisión de correos (409), listado, bloqueo de auto-desactivación (422), desactivación con revocación de tokens, consulta y actualización de consultorio, y rechazos 403 para rol `AUXILIARY` (RC-005).
- [x] 4.4 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test` y `pnpm --filter backend test:e2e` en verde, y hacer commit: `git add Backend/src Backend/test && git commit -m "feat(identity): agregar UsersController, ClinicController y suite de pruebas E2E"`


## 5. Regeneración del contrato OpenAPI y cierre del change

- [ ] 5.1 Regenerar `Backend/openapi.json` (`pnpm --filter backend openapi:generate`) verificando la documentación de `/v1/users` y `/v1/clinic`, y ejecutar `pnpm --filter backend test:cov` validando cobertura >= 90% en `domain`/`application` y >= 80% global.
- [ ] 5.2 Confirmar los cambios del contrato OpenAPI y el estado de `tasks.md` con un commit: `git add -A && git commit -m "chore(identity): regenerar openapi.json y completar tareas de B-04"` dejando `git status` limpio.

## Workflow follow-up

- Ejecutar `/opsx-sync` y `/opsx-archive` una vez completadas todas las tareas y verificaciones anteriores.