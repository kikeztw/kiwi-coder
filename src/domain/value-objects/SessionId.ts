export class SessionId {
  private constructor(private readonly value: string) {}

  static create(value: string): SessionId {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error('SessionId cannot be empty');
    }
    return new SessionId(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}
