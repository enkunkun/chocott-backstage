/**
 * The aicontext backend module for the catalog plugin: adds the custom
 * AIContext entity kind representing AI agent rules & skills.
 *
 * @packageDocumentation
 */

export { catalogModuleAicontext as default } from './module';
export { AIContextEntitiesProcessor } from './processor/AIContextEntitiesProcessor';
export {
  aiContextEntityV1alpha1Schema,
  aiContextEntityV1alpha1Validator,
} from './kinds/AIContextEntityV1alpha1';
export type {
  AIContextEntityV1alpha1,
  AIContextBaseSpecV1alpha1,
  AIContextTypedSpecV1alpha1,
  SkillSpecV1alpha1,
  RuleSpecV1alpha1,
} from './kinds/AIContextEntityV1alpha1';
