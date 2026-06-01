export type AgentName = 'coder' | 'plan' | string;

export type AgentProps = {
  name: AgentName;
  description: string;
};

export class Agent {
  private constructor(private readonly props: AgentProps) {}

  static create(props: AgentProps): Agent {
    if (!props.name.trim()) {
      throw new Error('Agent name cannot be empty');
    }
    return new Agent(props);
  }

  get name(): AgentName {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }
}
