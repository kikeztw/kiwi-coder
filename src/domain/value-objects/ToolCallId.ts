export class ToolCallId {
  private constructor(private readonly value: string) {}

  static create(value: string): ToolCallId {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error('ToolCallId cannot be empty');
    }
    return new ToolCallId(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ToolCallId): boolean {
    return this.value === other.value;
  }
}
