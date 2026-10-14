/** @type {import('plop').NodePlopAPI} */
module.exports = function (plop) {
  plop.setGenerator('module', {
    description: 'Generar estructura de 4 capas de Clean Architecture para un nuevo módulo',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Nombre del módulo en kebab-case (ej. patients, catalogs):',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'El nombre del módulo es obligatorio';
          }
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'El nombre debe estar en formato kebab-case (ej. patients, medical-records)';
          }
          return true;
        },
      },
    ],
    actions: [
      // 1. Domain: Entidad base
      {
        type: 'add',
        path: 'src/modules/{{kebabCase name}}/domain/entities/{{kebabCase name}}.entity.ts',
        template: `import { AggregateRoot } from '../../../shared';

export interface {{pascalCase name}}Props {
  id: string;
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class {{pascalCase name}} extends AggregateRoot {
  private constructor(
    readonly id: string,
    readonly clinicId: string,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    super();
  }

  static create(props: {{pascalCase name}}Props): {{pascalCase name}} {
    return new {{pascalCase name}}(
      props.id,
      props.clinicId,
      props.createdAt,
      props.updatedAt,
    );
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
`,
      },

      // 2. Domain: Errores tipados
      {
        type: 'add',
        path: 'src/modules/{{kebabCase name}}/domain/errors/{{kebabCase name}}.errors.ts',
        template: `import { DomainError, DomainErrorCategory } from '../../../shared';

export class {{pascalCase name}}NotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = '{{constantCase name}}_NOT_FOUND';

  constructor(id: string) {
    super(\`{{pascalCase name}} con ID \${id} no encontrado\`);
  }
}
`,
      },

      // 3. Domain: Puerto de repositorio
      {
        type: 'add',
        path: 'src/modules/{{kebabCase name}}/domain/ports/{{kebabCase name}}.repository.port.ts',
        template: `import { {{pascalCase name}} } from '../entities/{{kebabCase name}}.entity';

export const {{constantCase name}}_REPOSITORY_PORT = Symbol('{{constantCase name}}_REPOSITORY_PORT');

export interface {{pascalCase name}}RepositoryPort {
  findById(clinicId: string, id: string): Promise<{{pascalCase name}} | null>;
  save(entity: {{pascalCase name}}): Promise<void>;
}
`,
      },

      // 4. Application: Puerto de consultas (CQRS read port separado de write port)
      {
        type: 'add',
        path: 'src/modules/{{kebabCase name}}/application/ports/{{kebabCase name}}.queries.port.ts',
        template: `export const {{constantCase name}}_QUERIES_PORT = Symbol('{{constantCase name}}_QUERIES_PORT');

export interface {{pascalCase name}}ListItemDto {
  id: string;
  clinicId: string;
  createdAt: string;
}

export interface {{pascalCase name}}QueriesPort {
  list(clinicId: string): Promise<{{pascalCase name}}ListItemDto[]>;
}
`,
      },

      // 5. Infrastructure: Repositorio Prisma
      {
        type: 'add',
        path: 'src/modules/{{kebabCase name}}/infrastructure/repositories/prisma-{{kebabCase name}}.repository.ts',
        template: `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared';
import { {{pascalCase name}} } from '../../domain/entities/{{kebabCase name}}.entity';
import { {{pascalCase name}}RepositoryPort } from '../../domain/ports/{{kebabCase name}}.repository.port';

@Injectable()
export class Prisma{{pascalCase name}}Repository implements {{pascalCase name}}RepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(_clinicId: string, _id: string): Promise<{{pascalCase name}} | null> {
    // Implementar consulta Prisma retornando la entidad de dominio mapeada
    return null;
  }

  async save(_entity: {{pascalCase name}}): Promise<void> {
    // Implementar persistencia en Prisma
  }
}
`,
      },

      // 6. Presentation: Controlador REST
      {
        type: 'add',
        path: 'src/modules/{{kebabCase name}}/presentation/controllers/{{kebabCase name}}.controller.ts',
        template: `import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('{{kebabCase name}}')
@Controller('{{kebabCase name}}')
export class {{pascalCase name}}Controller {
  // Los controladores solo validan, llaman casos de uso e inyectan respuestas
}
`,
      },

      // 7. Infrastructure: Módulo NestJS con ensamblaje de puertos
      {
        type: 'add',
        path: 'src/modules/{{kebabCase name}}/infrastructure/{{kebabCase name}}.module.ts',
        template: `import { Module } from '@nestjs/common';
import { {{constantCase name}}_REPOSITORY_PORT } from '../domain/ports/{{kebabCase name}}.repository.port';
import { Prisma{{pascalCase name}}Repository } from './repositories/prisma-{{kebabCase name}}.repository';
import { {{pascalCase name}}Controller } from '../presentation/controllers/{{kebabCase name}}.controller';

@Module({
  controllers: [{{pascalCase name}}Controller],
  providers: [
    {
      provide: {{constantCase name}}_REPOSITORY_PORT,
      useClass: Prisma{{pascalCase name}}Repository,
    },
    Prisma{{pascalCase name}}Repository,
  ],
  exports: [{{constantCase name}}_REPOSITORY_PORT],
})
export class {{pascalCase name}}Module {}
`,
      },

      // 8. Public API: index.ts
      {
        type: 'add',
        path: 'src/modules/{{kebabCase name}}/index.ts',
        template: `// Domain exports
export * from './domain/entities/{{kebabCase name}}.entity';
export * from './domain/errors/{{kebabCase name}}.errors';
export * from './domain/ports/{{kebabCase name}}.repository.port';

// Application ports exports
export * from './application/ports/{{kebabCase name}}.queries.port';

// Infrastructure module export
export * from './infrastructure/{{kebabCase name}}.module';
`,
      },
    ],
  });
};
