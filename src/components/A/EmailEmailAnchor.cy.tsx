import React from 'react';
import EmailAnchor from './Email';

describe('<EmailAnchor />', () => {
  it('renders', () => {
    cy.mount(<EmailAnchor>mark.simmons@leagent.com</EmailAnchor>);
    cy.get('a#reidget-nav-email').should(
      'contains.text',
      'mark.simmons@leagent.com'
    );
    cy.get('a#reidget-nav-email').should(
      'have.attr',
      'href',
      'mailto:mark.simmons@leagent.com'
    );
  });
});
