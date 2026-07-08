import { InfoCard, StructuredMetadataTable } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';

/**
 * カスタム kind AIContext（AI エージェントの rules / skills）の spec を表示するカード。
 * owner / lifecycle は EntityAboutCard 側に出るため、ここでは type 固有のフィールドだけを表示する。
 * See https://github.com/backstage/backstage/issues/33575
 */
export const AIContextSpecCard = () => {
  const { entity } = useEntity();
  const {
    type,
    owner: _owner,
    lifecycle: _lifecycle,
    ...details
  } = (entity.spec ?? {}) as { type?: string } & Record<string, unknown>;

  const titleByType: Record<string, string> = {
    rule: 'Rule details',
    skill: 'Skill details',
    command: 'Command details',
  };
  const title = (type && titleByType[type]) || 'AIContext details';

  return (
    <InfoCard title={title}>
      <StructuredMetadataTable metadata={details} />
    </InfoCard>
  );
};
