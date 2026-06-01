import { Model } from '../entities/Model.js';
import { ModelId } from '../value-objects/ModelId.js';

export interface IModelRepository {
  list(): Promise<Model[]>;
  findById(id: ModelId): Promise<Model | null>;
  getDefault(provider: string): Promise<Model | null>;
}
