import { findAgentRecordByRealtorId, findAgentRecordByAgentId } from './model';
import { cache } from 'react';

export const cachedFindAgentRecordByAgentId = cache(findAgentRecordByAgentId);
export const cachedFindAgentRecordByRealtorId = cache(findAgentRecordByRealtorId);
