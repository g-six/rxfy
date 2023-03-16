import { AgentData } from '@/_typings/agent';
import { ReactNode } from 'react';

export function PersonalBioParagraph(
  props: Record<string, unknown>
) {
  const { children, agent: data, ...attribs } = props;

  if (data) {
    const agent = data as AgentData;
    if (agent.metatags && agent.metatags.personal_bio) {
      return (
        <p id='reidget-personal-bio' {...attribs}>
          {agent.metatags.personal_bio}
        </p>
      );
    }
  }
  return (
    <p id='reidget-personal-bio' {...attribs}>
      {children as ReactNode[]}
    </p>
  );
}

export default PersonalBioParagraph;
