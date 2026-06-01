import { Model } from '../../domain/entities/Model.js';
import { ModelId } from '../../domain/value-objects/ModelId.js';
import type { ModelDTO } from '../dto/ModelDTO.js';

export function modelToDTO(model: Model): ModelDTO {
  return {
    id: model.id.toString(),
    provider: model.provider,
    model: model.model,
    name: model.name,
    isDefault: model.isDefault,
  };
}

export function modelFromDTO(dto: ModelDTO): Model {
  return Model.create({
    id: ModelId.create(dto.id),
    provider: dto.provider,
    model: dto.model,
    name: dto.name,
    isDefault: dto.isDefault,
  });
}
