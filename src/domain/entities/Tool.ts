export type ToolProps = {
  name: string;
  description?: string;
  readOnly: boolean;
  needsApproval: boolean;
};

export class Tool {
  private constructor(private readonly props: ToolProps) {}

  static create(props: ToolProps): Tool {
    if (!props.name.trim()) {
      throw new Error('Tool name cannot be empty');
    }
    return new Tool(props);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get readOnly(): boolean {
    return this.props.readOnly;
  }

  get needsApproval(): boolean {
    return this.props.needsApproval;
  }
}
