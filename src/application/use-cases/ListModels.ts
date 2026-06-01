import type { IModelRepository } from '../../domain/repositories/IModelRepository.js';
import type { ModelDTO } from '../dto/ModelDTO.js';
import { modelToDTO } from '../mappers/modelMapper.js';

export class ListModels {
  constructor(private readonly models: IModelRepository) {}

  async execute(): Promise<ModelDTO[]> {
    const models = await this.models.list();
    return models.map(modelToDTO);
  }
}
