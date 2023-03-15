import { AgentData } from '@/_typings/agent';

export function EmailAnchor(props: Record<string, unknown>) {
  const { children, agent: data, ...attribs } = props;
  let email = 'mark.simmons@leagent.com';

  if (data) {
    const agent = data as AgentData;
    if (agent.email) {
      email = agent.email;
    }
  }
  return (
    <a id='reidget-nav-email' href={`mailto:${email}`} {...props}>
      {email}
    </a>
  );
}

export default EmailAnchor;
