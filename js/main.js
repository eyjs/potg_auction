import { bus } from './core/bus.js';
import { Store } from './store/auctionStore.js';
import { initMasterPageController } from './controllers/masterPageController.js';
import { initAuctionPageController } from './controllers/auctionPageController.js';
import { renderMasterPage } from './views/masterPageView.js';
import { renderAuctionPage } from './views/auctionPageView.js';
import { showPage, showCustomAlert } from './views/sharedView.js';

// Expose to global scope for debugging and legacy access
window.EventBus = bus;
window.Store = Store;

function App() {
    // Central event listener for state changes
    bus.on('state:changed', (e) => {
        console.log('state:changed event received', e);
        const activePage = document.querySelector('.page-container.active');
        if (!activePage) return;
        const currentPageId = activePage.id;

        const changedKeys = e.changed || [];

        // Re-render the current page to reflect state changes
        if (currentPageId === 'masterPage') {
            if (changedKeys.some(key => ['users', 'teams', 'items'].includes(key))) {
                renderMasterPage();
            }
        } else if (currentPageId === 'auctionPage') {
            if (changedKeys.some(key => ['auctionState', 'users', 'teams', 'items'].includes(key))) {
                renderAuctionPage();
            }
        }
    });

    bus.on('item:sold', (data) => {
        const { itemName, winningTeamName, price } = data;
        const message = `<b>${itemName}</b> 님이<br>
         <b>${winningTeamName}</b> 팀에<br>
         <span style="font-size: 1.2em; color: var(--warning-color);">${price.toLocaleString()}P</span> 에 낙찰되었습니다!`;
        showCustomAlert(message, '낙찰 🎉');
    });

    // Initialize all controllers to set up event listeners
    initMasterPageController();
    initAuctionPageController();

    // Set the initial page
    renderMasterPage();
    renderAuctionPage();
    showPage('masterPage');
}

// Start the application
document.addEventListener('DOMContentLoaded', App);