export function PropertyCarousel(props: Record<string, unknown>) {
  const { children, agent: data, ...attribs } = props;
  return <div {...attribs}>Carousel!</div>;
}

export default PropertyCarousel;
