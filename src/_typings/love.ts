import { AgentData } from './agent';
import { CustomerDataModel } from './customer';
import { PropertyDataModel } from './property';

export interface LoveDataModel {
  id: number;
  property: PropertyDataModel;
  customer: CustomerDataModel;
  agent: AgentData;
  is_highlighted?: boolean;
}
