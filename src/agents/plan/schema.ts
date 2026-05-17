import { z } from 'zod';

export const ContextSummarySchema = z.object({
  relatedModules: z
    .array(
      z.object({
        path: z.string().describe('Repository-relative path to the file or module'),
        responsibility: z
          .string()
          .describe('What this module does and why it is relevant to the feature'),
      }),
    )
    .describe('Files and modules in the codebase directly related to the feature'),
  affectedEntities: z
    .array(z.string())
    .describe(
      'Domain entities, data models, schemas, types or interfaces touched by the feature',
    ),
  existingPatterns: z
    .array(z.string())
    .describe(
      'Architectural and coding patterns observed in the codebase that the implementation must respect',
    ),
  sideEffectRisks: z
    .array(z.string())
    .describe(
      'Concrete risks, tightly coupled areas or shared logic that could break when the feature is implemented',
    ),
  technicalDebt: z
    .array(z.string())
    .describe('Relevant technical debt that could complicate the implementation'),
  unexploredAreas: z
    .array(z.string())
    .describe(
      'Areas of the codebase the explorer could not investigate confidently and that the implementer should be aware of',
    ),
});

export type ContextSummary = z.infer<typeof ContextSummarySchema>;

export const ActorSchema = z.object({
  name: z.string(),
  role: z.string(),
});

export const AmbiguitySchema = z.object({
  ambiguity: z.string(),
  question: z.string(),
});

export const ApproachSchema = z.object({
  name: z.string(),
  description: z.string(),
  verdict: z.enum(['accepted', 'discarded']),
  reason: z.string(),
});

export const FileChangeSchema = z.object({
  path: z.string(),
  change: z.enum(['create', 'modify']),
  description: z.string(),
});

export const CriterionCoverageSchema = z.object({
  criterion: z.string(),
  addressedBySteps: z.array(z.number()),
});

export const PlanSchema = z.object({
  featureName: z.string().describe('Short kebab-case name identifying the feature'),
  comprehension: z.object({
    what: z.string(),
    why: z.string(),
    actors: z.array(ActorSchema),
    acceptanceCriteria: z.array(z.string()),
    edgeCases: z.array(z.string()),
    detectedAmbiguities: z.array(AmbiguitySchema),
  }),
  context: ContextSummarySchema,
  design: z.object({
    coreChallenge: z.string(),
    approachesConsidered: z.array(ApproachSchema),
    selectedApproach: z.string(),
    implementationSteps: z.array(z.string()),
    filesAffected: z.array(FileChangeSchema),
    technicalConsiderations: z.array(z.string()),
    acceptanceCriteriaCoverage: z.array(CriterionCoverageSchema),
    openRisks: z.array(z.string()),
  }),
});

export type Plan = z.infer<typeof PlanSchema>;
