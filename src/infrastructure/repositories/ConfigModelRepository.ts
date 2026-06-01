import { Model } from '../../domain/entities/Model.js';
import type { IModelRepository } from '../../domain/repositories/IModelRepository.js';
import { ModelId } from '../../domain/value-objects/ModelId.js';

export class ConfigModelRepository implements IModelRepository {
  async list(): Promise<Model[]> {
    const { getAllModels } = await import('../../providers/index.js');

    return getAllModels().map((model) => {
      const id = ModelId.create(model.id);
      return Model.create({
        id,
        provider: model.provider,
        model: id.getModel(),
        name: model.name,
        isDefault: model.default ?? false,
      });
    });
  }

  async findById(id: ModelId): Promise<Model | null> {
    const models = await this.list();
    return models.find((model) => model.id.equals(id)) ?? null;
  }

  async getDefault(provider: string): Promise<Model | null> {
    const { getDefaultModel } = await import('../../providers/index.js');
    const modelId = getDefaultModel(provider);
    if (!modelId) {
      return null;
    }
    return this.findById(ModelId.create(modelId));
  }
}
