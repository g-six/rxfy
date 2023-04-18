import { PropertyDataModel } from './property';

export interface LoveDataModel {
  id: number;
  property: PropertyDataModel;
}

export interface LovedPropertyDataModel extends PropertyDataModel {
  love?: number;
}
