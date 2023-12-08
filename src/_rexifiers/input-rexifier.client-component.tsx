'use client';
import { consoler } from '@/_helpers/consoler';
import useFormEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useFormEvent';
import { sendMessageToRealtor } from '@/_utilities/api-calls/call-realtor';
import { AgentData } from '@/_typings/agent';
import useEvent from '@/hooks/useEvent';

type Props = { 'data-input': string; type: 'text' | 'submit' | 'password' | 'search' | 'email'; 'data-form': string; value?: string; agent?: AgentData };
const FILE = 'input-rexifier.client-component.tsx';

async function contactAgent(
  agent: AgentData,
  data: {
    email: string;
    message: string;
    phone?: string;
    name?: string;
  },
) {
  const { email, name: customer_name, message } = data;
  if (agent.email && agent.full_name && customer_name && message) {
    const { origin: host } = new URL(location?.href);
    return await sendMessageToRealtor({
      customer_name,
      message,
      email,
      phone: data.phone || '',
      send_to: {
        email: agent.email,
        name: agent.full_name,
      },
      host,
    });
  }
}

export function InputClientComponentRexifier({ type, ...attributes }: Props) {
  const form = useFormEvent(attributes['data-form'] as unknown as Events);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { [attributes['data-input']]: value } = (form.data || { [attributes['data-input']]: '' }) as unknown as {
    [k: string]: string;
  };

  // Handle form submission based on data-form value
  const submitForm = () => {
    switch (attributes['data-form']) {
      case 'contact':
        const { name, email, phone, message } = form.data as unknown as {
          [k: string]: string;
        };
        if (attributes.agent && name && email && message) {
          contactAgent(attributes.agent, {
            name,
            email,
            phone,
            message,
          }).then(results => {
            notify({
              category: NotificationCategory.SUCCESS,
              message: `Fantastic! ${attributes.agent?.full_name} has been notified and should respond to you soon!`,
              timeout: 3200,
            });
          });
        }
        break;
    }
  };

  return type === 'submit' ? (
    <button
      {...attributes}
      type='button'
      onClick={() => {
        submitForm();
      }}
    >
      {attributes.value || 'Save'}
    </button>
  ) : (
    <input
      {...attributes}
      rx-rexifier={FILE}
      name={attributes['data-input']}
      onChange={evt => {
        form.fireEvent({
          [attributes['data-input']]: evt.currentTarget.value,
        } as unknown as EventsData);
      }}
    />
  );
}
