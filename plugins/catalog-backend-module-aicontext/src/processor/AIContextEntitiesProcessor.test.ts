import type { Entity } from '@backstage/catalog-model';
import {
  RELATION_DEPENDENCY_OF,
  RELATION_DEPENDS_ON,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
} from '@backstage/catalog-model';
import type { LocationSpec } from '@backstage/plugin-catalog-common';
import { AIContextEntitiesProcessor } from './AIContextEntitiesProcessor';

const location: LocationSpec = { type: 'url', target: 'https://example.com' };

describe('AIContextEntitiesProcessor', () => {
  const processor = new AIContextEntitiesProcessor();

  describe('validateEntityKind', () => {
    it('AIContext エンティティで true を返す', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AIContext',
        metadata: { name: 'my-skill' },
        spec: { type: 'skill', lifecycle: 'experimental', owner: 'guests' },
      };
      await expect(processor.validateEntityKind(entity)).resolves.toBe(true);
    });

    it('他 kind で false を返す', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'other' },
        spec: {},
      };
      await expect(processor.validateEntityKind(entity)).resolves.toBe(false);
    });
  });

  describe('postProcessEntity', () => {
    it('spec.owner から ownedBy / ownerOf relations を張る', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AIContext',
        metadata: { name: 'my-rule', namespace: 'default' },
        spec: {
          type: 'rule',
          lifecycle: 'production',
          owner: 'frontend-platform',
          category: 'style',
          ruleType: 'always',
          rationale: 'consistency',
        },
      };
      const emit = jest.fn();

      await processor.postProcessEntity(entity, location, emit);

      expect(emit).toHaveBeenCalledWith({
        type: 'relation',
        relation: {
          type: RELATION_OWNED_BY,
          source: { kind: 'AIContext', namespace: 'default', name: 'my-rule' },
          target: {
            kind: 'group',
            namespace: 'default',
            name: 'frontend-platform',
          },
        },
      });
      expect(emit).toHaveBeenCalledWith({
        type: 'relation',
        relation: {
          type: RELATION_OWNER_OF,
          source: {
            kind: 'group',
            namespace: 'default',
            name: 'frontend-platform',
          },
          target: { kind: 'AIContext', namespace: 'default', name: 'my-rule' },
        },
      });
    });

    it('skill の spec.dependsOn から dependsOn / dependencyOf relations を張る', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AIContext',
        metadata: { name: 'my-skill', namespace: 'default' },
        spec: {
          type: 'skill',
          lifecycle: 'production',
          owner: 'ai-platform-team',
          dependsOn: ['base-conventions'],
        },
      };
      const emit = jest.fn();

      await processor.postProcessEntity(entity, location, emit);

      expect(emit).toHaveBeenCalledWith({
        type: 'relation',
        relation: {
          type: RELATION_DEPENDS_ON,
          source: { kind: 'AIContext', namespace: 'default', name: 'my-skill' },
          target: {
            kind: 'aicontext',
            namespace: 'default',
            name: 'base-conventions',
          },
        },
      });
      expect(emit).toHaveBeenCalledWith({
        type: 'relation',
        relation: {
          type: RELATION_DEPENDENCY_OF,
          source: {
            kind: 'aicontext',
            namespace: 'default',
            name: 'base-conventions',
          },
          target: { kind: 'AIContext', namespace: 'default', name: 'my-skill' },
        },
      });
    });

    it('command の spec.dependsOn から dependsOn / dependencyOf relations を張る', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AIContext',
        metadata: { name: 'my-command', namespace: 'default' },
        spec: {
          type: 'command',
          lifecycle: 'production',
          owner: 'guest',
          invocation: '/my-command',
          dependsOn: ['tdd'],
        },
      };
      const emit = jest.fn();

      await processor.postProcessEntity(entity, location, emit);

      expect(emit).toHaveBeenCalledWith({
        type: 'relation',
        relation: {
          type: RELATION_DEPENDS_ON,
          source: { kind: 'AIContext', namespace: 'default', name: 'my-command' },
          target: { kind: 'aicontext', namespace: 'default', name: 'tdd' },
        },
      });
      expect(emit).toHaveBeenCalledWith({
        type: 'relation',
        relation: {
          type: RELATION_DEPENDENCY_OF,
          source: { kind: 'aicontext', namespace: 'default', name: 'tdd' },
          target: { kind: 'AIContext', namespace: 'default', name: 'my-command' },
        },
      });
    });

    it('他 kind のエンティティは素通しで relation を emit しない', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'other' },
        spec: { type: 'service', lifecycle: 'production', owner: 'guests' },
      };
      const emit = jest.fn();

      const result = await processor.postProcessEntity(entity, location, emit);

      expect(result).toBe(entity);
      expect(emit).not.toHaveBeenCalled();
    });
  });
});
