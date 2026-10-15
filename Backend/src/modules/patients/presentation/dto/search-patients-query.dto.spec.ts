import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchPatientsQueryDto } from './search-patients-query.dto';

describe('SearchPatientsQueryDto', () => {
  it('debe transformar y validar los query parameters correctamente', async () => {
    const raw = {
      q: 'Carlos',
      limit: '25',
      includeInactive: 'true',
    };

    const dto = plainToInstance(SearchPatientsQueryDto, raw);
    expect(dto.q).toBe('Carlos');
    expect(dto.limit).toBe(25);
    expect(dto.includeInactive).toBe(true);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('debe transformar includeInactive cuando ya es booleano o false', async () => {
    const rawFalse = {
      q: 'Carlos',
      includeInactive: false,
    };

    const dto = plainToInstance(SearchPatientsQueryDto, rawFalse);
    expect(dto.includeInactive).toBe(false);

    const rawOther = {
      q: 'Carlos',
      includeInactive: 'false',
    };
    const dtoOther = plainToInstance(SearchPatientsQueryDto, rawOther);
    expect(dtoOther.includeInactive).toBe(false);
  });

  it('debe rechazar cuando q está vacío o limit está fuera de rango', async () => {
    const raw = {
      q: '',
      limit: '100',
    };

    const dto = plainToInstance(SearchPatientsQueryDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
