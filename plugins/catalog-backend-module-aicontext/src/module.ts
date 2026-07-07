import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';
import { AIContextEntitiesProcessor } from './processor/AIContextEntitiesProcessor';

/**
 * Registers the custom AIContext entity kind (AI agent rules & skills)
 * with the catalog.
 */
export const catalogModuleAicontext = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'aicontext',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
      },
      async init({ catalog }) {
        catalog.addProcessor(new AIContextEntitiesProcessor());
      },
    });
  },
});
