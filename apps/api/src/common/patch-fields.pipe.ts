import { BadRequestException, PipeTransform } from '@nestjs/common';

/** Runtime validation for PATCH payloads, which TypeScript Partial<T> cannot validate. */
export class PatchFieldsPipe implements PipeTransform {
  constructor(
    private readonly allowed: readonly string[],
    private readonly numbers: readonly string[] = [],
    private readonly booleans: readonly string[] = [],
    private readonly enums: Readonly<Record<string, readonly string[]>> = {},
  ) {}
  transform(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Objeto de atualizacao invalido');
    const data = value as Record<string, unknown>;
    for (const [key, entry] of Object.entries(data)) {
      if (!this.allowed.includes(key)) throw new BadRequestException(`Campo nao permitido: ${key}`);
      if (entry === null) continue;
      if (this.numbers.includes(key)) {
        if (typeof entry !== 'number' || !Number.isFinite(entry)) throw new BadRequestException(`Numero invalido: ${key}`);
      } else if (this.booleans.includes(key)) {
        if (typeof entry !== 'boolean') throw new BadRequestException(`Booleano invalido: ${key}`);
      } else if (typeof entry !== 'string') throw new BadRequestException(`Texto invalido: ${key}`);
      if (this.enums[key] && !this.enums[key].includes(String(entry))) throw new BadRequestException(`Valor invalido: ${key}`);
    }
    return data;
  }
}
