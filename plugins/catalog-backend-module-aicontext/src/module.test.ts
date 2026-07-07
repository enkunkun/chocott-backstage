import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import catalogPlugin from '@backstage/plugin-catalog-backend';
import { resolve } from 'path';
import { catalogModuleAicontext } from './module';

// examples/aicontext.yaml を実際の catalog backend に取り込み、
// module 登録 → validation → ingestion → REST API までを通しで検証する
const examplesFile = resolve(__dirname, '../../../examples/aicontext.yaml');

async function fetchEntityByName(
  port: number,
  name: string,
): Promise<Response> {
  return fetch(
    `http://localhost:${port}/api/catalog/entities/by-name/aicontext/default/${name}`,
  );
}

async function waitForEntity(port: number, name: string): Promise<Response> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    const response = await fetchEntityByName(port, name);
    if (response.status === 200 || Date.now() > deadline) {
      return response;
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

describe('catalogModuleAicontext', () => {
  it('AIContext エンティティを取り込んで catalog API で返す', async () => {
    const { server } = await startTestBackend({
      features: [
        catalogPlugin,
        catalogModuleAicontext,
        mockServices.rootConfig.factory({
          data: {
            backend: { baseUrl: 'http://localhost:7007' },
            catalog: {
              rules: [{ allow: ['AIContext', 'Location'] }],
              locations: [{ type: 'file', target: examplesFile }],
            },
          },
        }),
      ],
    });

    const skillResponse = await waitForEntity(server.port(), 'frontend-design');
    expect(skillResponse.status).toBe(200);
    const skill = await skillResponse.json();
    expect(skill.spec.type).toBe('skill');
    // processor が owner relation を張っている
    expect(skill.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'ownedBy',
          targetRef: 'group:default/guests',
        }),
      ]),
    );

    const ruleResponse = await fetchEntityByName(
      server.port(),
      'use-internal-design-system',
    );
    expect(ruleResponse.status).toBe(200);
    const rule = await ruleResponse.json();
    expect(rule.spec.type).toBe('rule');
    expect(rule.spec.rationale).toBeDefined();
  }, 60_000);
});
