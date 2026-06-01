export class ModelId {
  private constructor(
    private readonly provider: string,
    private readonly model: string,
  ) {}

  static create(value: string): ModelId {
    const normalized = value.trim();
    const separatorIndex = normalized.indexOf('/');

    if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) {
      throw new Error('ModelId must use provider/model format');
    }

    return new ModelId(
      normalized.slice(0, separatorIndex),
      normalized.slice(separatorIndex + 1),
    );
  }

  getProvider(): string {
    return this.provider;
  }

  getModel(): string {
    return this.model;
  }

  toString(): string {
    return `${this.provider}/${this.model}`;
  }

  equals(other: ModelId): boolean {
    return this.toString() === other.toString();
  }
}
