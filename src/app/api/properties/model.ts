import { MLSProperty } from '@/_typings/property';
import { RealEstateBoardDataModel } from '@/_typings/real-estate-board';
import { createAgentRecordIfNoneFound } from '@/app/api/agents/model';

export async function createAgentsFromProperty(p: MLSProperty, real_estate_board: RealEstateBoardDataModel) {
  const agents: number[] = [];
  try {
    for await (const num of [1, 2, 3]) {
      const agent_id = p[`LA${num}_LoginName`] as string;
      const email = p[`LA${num}_Email`] as string;
      let full_name = p[`LA${num}_FullName`] as string;
      if (full_name) {
        full_name = full_name.split(' PREC').join('').split('*').join('');
        const phone = p[`LA${num}_PhoneNumber1`] as string;
        if (agent_id && email && phone && full_name) {
          const agent = await createAgentRecordIfNoneFound(
            {
              agent_id,
              email,
              phone,
              full_name,
            },
            real_estate_board,
            {
              lat: p.lat,
              lng: p.lng,
              target_area: p.Area,
              target_city: p.City,
              asking_price: p.AskingPrice,
              listing_date: `${p.ListingDate.substring(0, 10).split('-').map(Number).reverse().join('/')}`,
              property_type: `${p.PropertyType}`.trim(),
              beds: p.L_BedroomTotal,
              baths: p.L_TotalBaths,
              description: p.L_PublicRemakrs,
            },
          );
          agents.push(agent.id);
        }
      }
    }
  } catch (e) {
    console.log('Caught error in createAgentsFromProperty');
    console.log(e);
  }

  return agents;
}
