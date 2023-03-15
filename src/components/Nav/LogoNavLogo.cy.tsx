import React from 'react';
import NavLogo from './Logo';

describe('<NavLogo />', () => {
  it('renders div#reidget-nav-logo with text LOGO HERE', () => {
    cy.mount(<NavLogo>Mark Simmons</NavLogo>);
    cy.get('div#reidget-nav-logo').should(
      'contains.text',
      'Mark Simmons'
    );
  });
});
