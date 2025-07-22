import { AuctionController } from './controllers/AuctionController.js';
import { StorageService } from './services/StorageService.js';

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = StorageService.loadSession('currentUser') || { role: 'general', username: '게스트' };
  new AuctionController(currentUser);
});
