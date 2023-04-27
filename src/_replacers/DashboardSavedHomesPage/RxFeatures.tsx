import { SinglePropertyFeature } from '@/components/RxProperty/PropertyFeatureSection';
import React, { ReactElement } from 'react';

type Props = {
  child: ReactElement;
  features: Record<string, string>;
};

export default function RxFeatures({ child, features }: Props) {
  const hasFeatures = Object.keys(features);
  return (
    <div className={child.props.className}>
      {Object.keys(features)
        .sort()
        .map((feature: string, i) => {
          return <SinglePropertyFeature key={`${features[feature]}_${i}`} icon={features[feature]} label={feature} />;
        })}
    </div>
  );
}
