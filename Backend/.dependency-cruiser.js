/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-cannot-depend-on-infrastructure-or-presentation',
      comment: 'El dominio no puede depender de infraestructura, presentación ni frameworks (RC-012)',
      severity: 'error',
      from: { path: '(^src/modules/[^/]+/domain/|^src/shared/domain/)' },
      to: {
        path: '(^src/modules/[^/]+/(infrastructure|presentation)/|^src/shared/(infrastructure|presentation)/|@nestjs|@prisma/client|prisma)',
      },
    },
    {
      name: 'application-cannot-depend-on-infrastructure-or-presentation',
      comment: 'La capa de aplicación no puede depender de infraestructura ni presentación',
      severity: 'error',
      from: { path: '(^src/modules/[^/]+/application/|^src/shared/application/)' },
      to: {
        path: '(^src/modules/[^/]+/(infrastructure|presentation)/|^src/shared/(infrastructure|presentation)/|@prisma/client|prisma)',
      },
    },
    {
      name: 'presentation-cannot-depend-on-infrastructure',
      comment: 'La capa de presentación no puede depender directamente de infraestructura',
      severity: 'error',
      from: { path: '(^src/modules/[^/]+/presentation/|^src/shared/presentation/)' },
      to: {
        path: '(^src/modules/[^/]+/infrastructure/|^src/shared/infrastructure/|@prisma/client|prisma)',
      },
    },
    {
      name: 'no-cross-module-internal-imports',
      comment: 'Un módulo solo puede importar la API pública (index.ts) de otro módulo (RC-017)',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/([^/]+)/',
        pathNot: ['^src/modules/$1/', '^src/modules/[^/]+/index\\.ts$'],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
