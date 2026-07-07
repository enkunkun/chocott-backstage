import type { Entity } from '@backstage/catalog-model';
import {
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_DEPENDENCY_OF,
  RELATION_DEPENDS_ON,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
} from '@backstage/catalog-model';
import type { LocationSpec } from '@backstage/plugin-catalog-common';
import type {
  CatalogProcessor,
  CatalogProcessorEmit,
} from '@backstage/plugin-catalog-node';
import { processingResult } from '@backstage/plugin-catalog-node';
import type { AIContextEntityV1alpha1 } from '../kinds/AIContextEntityV1alpha1';
import { aiContextEntityV1alpha1Validator } from '../kinds/AIContextEntityV1alpha1';

/**
 * Validates AIContext entities and emits their relations, mirroring what
 * BuiltinKindsEntityProcessor does for the built-in kinds.
 */
export class AIContextEntitiesProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'AIContextEntitiesProcessor';
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    return aiContextEntityV1alpha1Validator.check(entity);
  }

  async postProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (
      entity.apiVersion !== 'backstage.io/v1alpha1' ||
      entity.kind !== 'AIContext'
    ) {
      return entity;
    }

    const aiContext = entity as AIContextEntityV1alpha1;
    const selfRef = getCompoundEntityRef(entity);

    const doEmit = (
      targets: string | string[] | undefined,
      context: { defaultKind?: string; defaultNamespace: string },
      outgoingRelation: string,
      incomingRelation: string,
    ): void => {
      if (!targets) {
        return;
      }
      for (const target of [targets].flat()) {
        const targetRef = parseEntityRef(target, context);
        emit(
          processingResult.relation({
            source: selfRef,
            type: outgoingRelation,
            target: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
          }),
        );
        emit(
          processingResult.relation({
            source: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
            type: incomingRelation,
            target: selfRef,
          }),
        );
      }
    };

    doEmit(
      aiContext.spec.owner,
      { defaultKind: 'group', defaultNamespace: selfRef.namespace },
      RELATION_OWNED_BY,
      RELATION_OWNER_OF,
    );
    if (aiContext.spec.type === 'skill') {
      doEmit(
        aiContext.spec.dependsOn,
        { defaultKind: 'aicontext', defaultNamespace: selfRef.namespace },
        RELATION_DEPENDS_ON,
        RELATION_DEPENDENCY_OF,
      );
    }

    return entity;
  }
}
