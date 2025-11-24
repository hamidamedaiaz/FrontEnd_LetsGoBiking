import { debounce } from './utils/debounce.js';
import { searchAddress } from './services/addressService.js';

/**
 * Classe pour gérer l'autocomplétion d'adresses
 */
class AddressAutocomplete {
    constructor(inputId, resultsId) {
        this.input = document.getElementById(inputId);
        this.resultsList = document.getElementById(resultsId);
        this.selectedAddress = null;
        this.addresses = [];
        this.currentFocus = -1;

        this.init();
    }

    init() {
        // Écouter les changements dans l'input avec debounce
        this.input.addEventListener('input', debounce((e) => {
            this.handleInput(e.target.value);
        }, 300));

        // Fermer les résultats si clic ailleurs
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsList.contains(e.target)) {
                this.hideResults();
            }
        });

        // Navigation au clavier
        this.input.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    async handleInput(query) {
        if (query.length < 3) {
            this.hideResults();
            return;
        }

        // Afficher le loader
        this.input.parentElement.classList.add('loading');

        // Rechercher les adresses
        this.addresses = await searchAddress(query);

        // Masquer le loader
        this.input.parentElement.classList.remove('loading');

        // Afficher les résultats
        this.displayResults();
    }

    displayResults() {
        this.resultsList.innerHTML = '';

        if (this.addresses.length === 0) {
            this.hideResults();
            return;
        }

        this.addresses.forEach((address, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="address-label">${address.label}</span>
                <span class="address-city">${address.postcode} ${address.city}</span>
            `;
            
            li.addEventListener('click', () => {
                this.selectAddress(address);
            });

            this.resultsList.appendChild(li);
        });

        this.resultsList.classList.add('active');
    }

    hideResults() {
        this.resultsList.classList.remove('active');
        this.currentFocus = -1;
    }

    selectAddress(address) {
        this.selectedAddress = address;
        this.input.value = address.label;
        this.hideResults();

        // Déclencher un événement personnalisé
        this.input.dispatchEvent(new CustomEvent('addressSelected', {
            detail: address
        }));
    }

    handleKeyboard(e) {
        const items = this.resultsList.querySelectorAll('li');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.currentFocus++;
            this.setActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.currentFocus--;
            this.setActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.currentFocus > -1 && items[this.currentFocus]) {
                items[this.currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            this.hideResults();
        }
    }

    setActive(items) {
        if (!items || items.length === 0) return;

        // Limiter le focus
        if (this.currentFocus >= items.length) this.currentFocus = 0;
        if (this.currentFocus < 0) this.currentFocus = items.length - 1;

        // Retirer la classe selected de tous
        items.forEach(item => item.classList.remove('selected'));

        // Ajouter selected à l'élément actuel
        items[this.currentFocus].classList.add('selected');
    }

    getSelectedAddress() {
        return this.selectedAddress;
    }
}

export default AddressAutocomplete;