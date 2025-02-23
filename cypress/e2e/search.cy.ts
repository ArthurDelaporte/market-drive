describe('Search functionality', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
  })

  describe('Desktop Search', () => {
    it('should search for a product and navigate to results', () => {
      // Utilise la barre de recherche desktop
      cy.get('.hidden.md\\:block form input[placeholder="Rechercher un produit..."]')
        .type('produit test')
        .parent('form')
        .submit()

      // Vérifie l'URL
      cy.url().should('include', '/produits?productName=produit%20test')
    })

    it('should clear search input when clicking X button', () => {
      // Utilise la barre de recherche desktop
      cy.get('.hidden.md\\:block form input[placeholder="Rechercher un produit..."]')
        .type('produit test')
        .should('have.value', 'produit test')

      // Clique sur le X (en utilisant la classe spécifique)
      cy.get('.hidden.md\\:block form .search-bar-header.right-3')
        .click()

      // Vérifie que le champ est vide
      cy.get('.hidden.md\\:block form input[placeholder="Rechercher un produit..."]')
        .should('have.value', '')
    })
  })

  describe('Mobile Search', () => {
    it('should search for a product and navigate to results on mobile', () => {
      // Configure la vue mobile
      cy.viewport('iphone-x')

      // Utilise la barre de recherche mobile
      cy.get('.md\\:hidden form input[placeholder="Rechercher un produit..."]')
        .type('produit test')
        .parent('form')
        .submit()

      // Vérifie l'URL
      cy.url().should('include', '/produits?productName=produit%20test')
    })

    it('should clear search input when clicking X button on mobile', () => {
      // Configure la vue mobile
      cy.viewport('iphone-x')

      // Utilise la barre de recherche mobile
      cy.get('.md\\:hidden form input[placeholder="Rechercher un produit..."]')
        .type('produit test')
        .should('have.value', 'produit test')

      // Clique sur le X
      cy.get('.md\\:hidden form .search-bar-header.right-3')
        .click()

      // Vérifie que le champ est vide
      cy.get('.md\\:hidden form input[placeholder="Rechercher un produit..."]')
        .should('have.value', '')
    })
  })
})