import { AgentData } from '@/_typings/agent';

export function PersonalTitle(props: Record<string, unknown>) {
  const { children, agent: data, ...attribs } = props;

  if (data) {
    const agent = data as AgentData;
    if (agent.metatags && agent.metatags.personal_title) {
      return (
        <h1 id='reidget-personal-title' {...attribs}>
          {agent.metatags.personal_title}
        </h1>
      );
    }
  }
  return (
    <h1 id='reidget-personal-title' {...attribs}>
      {children as ReactNode[]}
    </h1>
  );
}

export default PersonalTitle;
