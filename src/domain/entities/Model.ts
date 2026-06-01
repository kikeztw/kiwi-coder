import { ModelId } from '../value-objects/ModelId.js';

export type ModelProps = {
  id: ModelId;
  provider: string;
  model: string;
  name: string;
  isDefault?: boolean;
};

export class Model {
  private constructor(private readonly props: ModelProps) {}

  static create(props: ModelProps): Model {
    if (!props.provider.trim()) {
      throw new Error('Model provider cannot be empty');
    }
    if (!props.model.trim()) {
      throw new Error('Model name cannot be empty');
    }
    if (!props.name.trim()) {
      throw new Error('Model display name cannot be empty');
    }
    return new Model(props);
  }

  get id(): ModelId {
    return this.props.id;
  }

  get provider(): string {
    return this.props.provider;
  }

  get model(): string {
    return this.props.model;
  }

  get name(): string {
    return this.props.name;
  }

  get isDefault(): boolean {
    return this.props.isDefault ?? false;
  }
}
