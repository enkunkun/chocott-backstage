import { readFileSync } from 'fs';
import { resolve } from 'path';
import YAML from 'yaml';
import type { Entity } from '@backstage/catalog-model';
import { aiContextEntityV1alpha1Validator } from './AIContextEntityV1alpha1';

// examples/aicontext.yaml が schema 変更で腐っていないことを保証する
const examplesFile = resolve(__dirname, '../../../../examples/aicontext.yaml');

describe('examples/aicontext.yaml', () => {
  const docs = YAML.parseAllDocuments(readFileSync(examplesFile, 'utf8'))
    .map(doc => doc.toJS() as Entity)
    .filter(Boolean);

  it('少なくとも skill / rule / command の 3 タイプを含む', () => {
    const types = docs.map(d => (d.spec as { type?: string })?.type);
    expect(types).toEqual(expect.arrayContaining(['skill', 'rule', 'command']));
  });

  it('source 付きの外部インポート例を含む', () => {
    const hasSource = docs.some(
      d => (d.spec as { source?: unknown })?.source !== undefined,
    );
    expect(hasSource).toBe(true);
  });

  it.each(docs.map(d => [d.metadata?.name, d] as const))(
    '%s が validator を通る',
    async (_name, entity) => {
      await expect(
        aiContextEntityV1alpha1Validator.check(entity),
      ).resolves.toBe(true);
    },
  );
});
