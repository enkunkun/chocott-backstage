import type { Entity } from '@backstage/catalog-model';
import { entityKindSchemaValidator } from '@backstage/catalog-model';

/**
 * Backstage catalog AIContext kind entity, representing contextual
 * information (rules / skills) consumed by AI coding agents.
 *
 * @see https://github.com/backstage/backstage/issues/33575
 */
export interface AIContextEntityV1alpha1 extends Entity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'AIContext';
  spec: AIContextBaseSpecV1alpha1 & AIContextTypedSpecV1alpha1;
}

/**
 * Fields shared by every AIContext type.
 *
 * NOTE: interface ではなく type alias にしている。named interface には暗黙の
 * index signature が無く、`Entity.spec: JsonObject` と非互換になるため
 * （upstream の kind 定義が spec をインライン型で書いているのと同じ理由）。
 */
export type AIContextBaseSpecV1alpha1 = {
  /** The type of AI context. */
  type: string;
  /** Reuses Backstage lifecycle semantics: 'experimental', 'production', 'deprecated'. */
  lifecycle: string;
  /** Entity reference to the owning group or user. */
  owner: string;
  /** Defaults to 'public'. */
  visibility?: 'public' | 'private' | 'restricted';
  /**
   * Provenance for imported / vendored context. Absent means first-party
   * (self-authored). Present means it originates from a plugin or marketplace.
   */
  source?: AIContextSourceV1alpha1;
};

/** Where an imported AIContext comes from. */
export type AIContextSourceV1alpha1 = {
  /** Marketplace / registry name, e.g. 'anthropic-agent-skills', 'kuu-marketplace'. */
  registry: string;
  /** Plugin bundling this context, e.g. 'example-skills'. */
  plugin?: string;
  /** Pinned version or git sha. */
  version?: string;
  /** Upstream URL. */
  url?: string;
  /** Whether currently installed (active) vs merely available in a marketplace. */
  installed?: boolean;
};

/** Discriminated union on `type`. Extend as new types are added. */
export type AIContextTypedSpecV1alpha1 =
  | SkillSpecV1alpha1
  | RuleSpecV1alpha1
  | CommandSpecV1alpha1;

export type SkillSpecV1alpha1 = {
  type: 'skill';
  /** Freeform tags for engineering disciplines, e.g. 'backend', 'web', 'ml'. */
  disciplines?: string[];
  /** Freeform descriptive categories, e.g. 'testing', 'architecture'. */
  categories?: string[];
  /** AI tools this skill is designed for, e.g. 'claude-code', 'copilot'. */
  agents?: string[];
  /** Use cases this skill addresses, e.g. 'code-generation', 'review'. */
  usecases?: string[];
  /** Tools pre-approved for use with this skill. */
  allowedTools?: string[];
  /** Entity references to other skills this one depends on. */
  dependsOn?: string[];
  /** License identifier. */
  license?: string;
  /** Environment or version requirements. Max 500 chars. */
  compatibility?: string;
};

export type RuleSpecV1alpha1 = {
  type: 'rule';
  /** Freeform disciplines for the rule, e.g. 'backend', 'web', 'ml'. */
  disciplines?: string[];
  /** Freeform category for the rule, e.g. 'security', 'style'. */
  category: string;
  /** The type classification of this rule, e.g. 'always', 'auto', 'agent'. */
  ruleType: string;
  /** Explanation of why this rule exists. */
  rationale: string;
  /** Configuration controlling when and how this rule is activated. */
  activation?: {
    /** Activation strategy, e.g. 'always', 'intelligent', 'file_match', 'manual'. */
    strategy: string;
    /** Programming languages this rule applies to. */
    languages?: string[];
    /** File glob patterns that trigger this rule. */
    fileGlobs?: string[];
  };
  /** Reference material for the rule. */
  sources?: Array<{
    type: 'docs' | 'example' | 'link';
    url: string;
  }>;
};

export type CommandSpecV1alpha1 = {
  type: 'command';
  /** The slash invocation, e.g. '/dig'. */
  invocation: string;
  /** Freeform disciplines, e.g. 'backend', 'web'. */
  disciplines?: string[];
  /** Freeform categories, e.g. 'planning', 'git'. */
  categories?: string[];
  /** AI tools this command is designed for, e.g. 'claude-code'. */
  agents?: string[];
  /** Use cases this command addresses. */
  usecases?: string[];
  /** Entity references to other AIContexts this command depends on. */
  dependsOn?: string[];
};

const stringArray = {
  type: 'array',
  items: { type: 'string', minLength: 1 },
} as const;

/**
 * JSON Schema for AIContext v1alpha1, following the same structure as the
 * built-in kind schemas in @backstage/catalog-model (draft-07, `$ref: Entity`).
 */
export const aiContextEntityV1alpha1Schema = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'AIContextEntityV1alpha1',
  description:
    'Contextual information (rules / skills) consumed by AI coding agents, ' +
    'catalogued for discoverability and governance.',
  allOf: [
    { $ref: 'Entity' },
    {
      type: 'object',
      required: ['spec'],
      properties: {
        apiVersion: { enum: ['backstage.io/v1alpha1'] },
        kind: { enum: ['AIContext'] },
        spec: {
          type: 'object',
          required: ['type', 'lifecycle', 'owner'],
          properties: {
            type: {
              type: 'string',
              enum: ['skill', 'rule', 'command'],
              examples: ['skill'],
            },
            lifecycle: {
              type: 'string',
              minLength: 1,
              examples: ['experimental', 'production', 'deprecated'],
            },
            owner: {
              type: 'string',
              minLength: 1,
              examples: ['ai-platform-team'],
            },
            visibility: {
              type: 'string',
              enum: ['public', 'private', 'restricted'],
            },
            source: {
              type: 'object',
              required: ['registry'],
              properties: {
                registry: { type: 'string', minLength: 1 },
                plugin: { type: 'string', minLength: 1 },
                version: { type: 'string', minLength: 1 },
                url: { type: 'string', minLength: 1 },
                installed: { type: 'boolean' },
              },
            },
          },
          allOf: [
            {
              if: {
                properties: { type: { const: 'skill' } },
                required: ['type'],
              },
              then: {
                properties: {
                  disciplines: stringArray,
                  categories: stringArray,
                  agents: stringArray,
                  usecases: stringArray,
                  allowedTools: stringArray,
                  dependsOn: stringArray,
                  license: { type: 'string', minLength: 1 },
                  compatibility: { type: 'string', maxLength: 500 },
                },
              },
            },
            {
              if: {
                properties: { type: { const: 'rule' } },
                required: ['type'],
              },
              then: {
                required: ['category', 'ruleType', 'rationale'],
                properties: {
                  disciplines: stringArray,
                  category: { type: 'string', minLength: 1 },
                  ruleType: {
                    type: 'string',
                    minLength: 1,
                    examples: ['always', 'auto', 'agent'],
                  },
                  rationale: { type: 'string', minLength: 1 },
                  activation: {
                    type: 'object',
                    required: ['strategy'],
                    properties: {
                      strategy: {
                        type: 'string',
                        minLength: 1,
                        examples: ['always', 'intelligent', 'file_match'],
                      },
                      languages: stringArray,
                      fileGlobs: stringArray,
                    },
                  },
                  sources: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['type', 'url'],
                      properties: {
                        type: { enum: ['docs', 'example', 'link'] },
                        url: { type: 'string', minLength: 1 },
                      },
                    },
                  },
                },
              },
            },
            {
              if: {
                properties: { type: { const: 'command' } },
                required: ['type'],
              },
              then: {
                required: ['invocation'],
                properties: {
                  invocation: {
                    type: 'string',
                    minLength: 1,
                    examples: ['/dig', '/grafana'],
                  },
                  disciplines: stringArray,
                  categories: stringArray,
                  agents: stringArray,
                  usecases: stringArray,
                  dependsOn: stringArray,
                },
              },
            },
          ],
        },
      },
    },
  ],
};

const schemaValidator = entityKindSchemaValidator<AIContextEntityV1alpha1>(
  aiContextEntityV1alpha1Schema,
);

/**
 * KindValidator for AIContext, mirroring the built-in kind validators:
 * resolves true when the entity is a valid AIContext, false when the entity
 * is some other kind, and throws when it claims to be an AIContext but is
 * structurally invalid.
 */
export const aiContextEntityV1alpha1Validator = {
  async check(data: Entity): Promise<boolean> {
    return schemaValidator(data) === data;
  },
};
