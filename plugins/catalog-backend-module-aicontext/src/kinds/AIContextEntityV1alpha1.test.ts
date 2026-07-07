import type { Entity } from '@backstage/catalog-model';
import { aiContextEntityV1alpha1Validator as validator } from './AIContextEntityV1alpha1';

const validSkill: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AIContext',
  metadata: {
    name: 'frontend-design',
    description: 'Skill for creating production-grade frontend interfaces',
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    owner: 'ai-platform-team',
    visibility: 'public',
    disciplines: ['backend', 'web'],
    categories: ['framework'],
    agents: ['claude-code'],
    usecases: ['code-generation'],
    allowedTools: ['Read', 'Edit', 'Grep'],
    dependsOn: ['aicontext:default/base-conventions'],
    license: 'Apache-2.0',
    compatibility: 'Requires Node.js 20+',
  },
};

const validRule: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AIContext',
  metadata: {
    name: 'use-internal-design-system',
    description:
      'Agents must use the internal design system components instead of raw HTML',
  },
  spec: {
    type: 'rule',
    lifecycle: 'production',
    owner: 'frontend-platform',
    visibility: 'public',
    disciplines: ['web'],
    category: 'framework',
    ruleType: 'always',
    rationale:
      'Ensures visual consistency and accessibility compliance across all product surfaces.',
    activation: {
      strategy: 'file_match',
      languages: ['typescript', 'javascript'],
      fileGlobs: ['**/*.tsx', '**/*.jsx'],
    },
    sources: [
      { type: 'docs', url: 'https://design-system.example.com/getting-started' },
      { type: 'example', url: 'https://github.com/example-org/design-system' },
    ],
  },
};

// deep clone + spec mutation helper
function withSpec(entity: Entity, mutate: (spec: any) => void): Entity {
  const copy = JSON.parse(JSON.stringify(entity));
  mutate(copy.spec);
  return copy;
}

describe('aiContextEntityV1alpha1Validator', () => {
  it('有効な skill エンティティを受理する', async () => {
    await expect(validator.check(validSkill)).resolves.toBe(true);
  });

  it('有効な rule エンティティを受理する', async () => {
    await expect(validator.check(validRule)).resolves.toBe(true);
  });

  it('任意フィールドのみ省略した最小の skill を受理する', async () => {
    const minimal: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AIContext',
      metadata: { name: 'minimal-skill' },
      spec: { type: 'skill', lifecycle: 'experimental', owner: 'guests' },
    };
    await expect(validator.check(minimal)).resolves.toBe(true);
  });

  it('他 kind のエンティティには干渉しない（false を返す）', async () => {
    const component: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'example' },
      spec: { type: 'service', lifecycle: 'production', owner: 'guests' },
    };
    await expect(validator.check(component)).resolves.toBe(false);
  });

  it.each([
    [
      'spec.type が skill/rule 以外',
      withSpec(validSkill, s => (s.type = 'prompt')),
    ],
    ['lifecycle 欠落', withSpec(validSkill, s => delete s.lifecycle)],
    ['owner 欠落', withSpec(validSkill, s => delete s.owner)],
    ['visibility 不正値', withSpec(validSkill, s => (s.visibility = 'secret'))],
    ['rule: rationale 欠落', withSpec(validRule, s => delete s.rationale)],
    ['rule: category 欠落', withSpec(validRule, s => delete s.category)],
    ['rule: ruleType 欠落', withSpec(validRule, s => delete s.ruleType)],
    [
      'rule: activation.strategy 欠落',
      withSpec(validRule, s => delete s.activation.strategy),
    ],
    [
      'rule: sources[].type 不正値',
      withSpec(validRule, s => (s.sources[0].type = 'blog')),
    ],
    [
      'skill: compatibility が 500 文字超',
      withSpec(validSkill, s => (s.compatibility = 'x'.repeat(501))),
    ],
    [
      'skill: dependsOn が文字列配列でない',
      withSpec(validSkill, s => (s.dependsOn = [{ ref: 'foo' }])),
    ],
  ])('%s はエラーになる', async (_name, entity) => {
    await expect(validator.check(entity)).rejects.toThrow();
  });
});
