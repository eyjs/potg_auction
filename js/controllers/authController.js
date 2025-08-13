import * as dom from '../../domRefs.js';
import { showPage } from '../views/sharedView.js';

export function initAuthController() {
  dom.loginBtn.addEventListener('click', () => {
    const username = dom.loginUsernameInput.value;
    const password = dom.loginPasswordInput.value;
    const user = window.Store.actions.login(username, password);

    if (user) {
      dom.loginMessage.textContent = '';
      dom.loginUsernameInput.value = '';
      dom.loginPasswordInput.value = '';
      showPage(user.role === 'master' ? 'masterPage' : 'auctionPage');
    } else {
      dom.loginMessage.textContent = '잘못된 사용자 이름 또는 비밀번호입니다.';
      dom.loginMessage.classList.add('red');
    }
  });

  dom.logoutBtnMaster.addEventListener('click', () => window.Store.actions.logout());
  dom.logoutBtnAuction.addEventListener('click', () => window.Store.actions.logout());

  // Page navigation buttons
  dom.goToAuctionPageBtn.addEventListener('click', () => showPage('auctionPage'));
  dom.goToMasterPageBtn.addEventListener('click', () => showPage('masterPage'));
}
