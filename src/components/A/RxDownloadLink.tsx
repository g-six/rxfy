'use client';
import { AgentData } from '@/_typings/agent';
import React from 'react';
type Props = {
  filename: string;
  agent: AgentData;
  className: string;
  children: React.ReactElement;
};
export default function RxDownloadLink({ children, agent, className, filename }: Props) {
  return (
    <a
      className={className}
      href={`data:text/vcard;charset=utf-8,BEGIN:VCARD\nVERSION:4.0\nN:${agent.full_name};;\nFN:${agent.full_name}\nORG:${
        agent.metatags?.brokerage_name || agent.full_name
      }\nTITLE:Leagent Realtor\nTEL;TYPE=WORK,VOICE:${agent.phone}\nEMAIL;TYPE=PREF,INTERNET:${agent.email}\nEND:VCARD`}
    >
      {children}
    </a>
  );
}
