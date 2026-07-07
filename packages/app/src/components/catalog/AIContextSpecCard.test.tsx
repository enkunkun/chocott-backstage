import { render, screen } from '@testing-library/react';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import type { Entity } from '@backstage/catalog-model';
import { AIContextSpecCard } from './AIContextSpecCard';

function renderWithEntity(entity: Entity) {
  return render(
    <EntityProvider entity={entity}>
      <AIContextSpecCard />
    </EntityProvider>,
  );
}

describe('AIContextSpecCard', () => {
  it('skill の spec フィールドを表示する', () => {
    renderWithEntity({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AIContext',
      metadata: { name: 'frontend-design' },
      spec: {
        type: 'skill',
        lifecycle: 'production',
        owner: 'ai-platform-team',
        agents: ['claude-code'],
        allowedTools: ['Read', 'Edit'],
      },
    });

    expect(screen.getByText('Skill details')).toBeInTheDocument();
    expect(screen.getByText('claude-code')).toBeInTheDocument();
    // owner / lifecycle は AboutCard 側で表示するのでこのカードには出さない
    expect(screen.queryByText('ai-platform-team')).not.toBeInTheDocument();
  });

  it('rule の spec フィールドを表示する', () => {
    renderWithEntity({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AIContext',
      metadata: { name: 'use-internal-design-system' },
      spec: {
        type: 'rule',
        lifecycle: 'production',
        owner: 'frontend-platform',
        category: 'framework',
        ruleType: 'always',
        rationale: 'Ensures visual consistency.',
      },
    });

    expect(screen.getByText('Rule details')).toBeInTheDocument();
    expect(screen.getByText('Ensures visual consistency.')).toBeInTheDocument();
  });
});
