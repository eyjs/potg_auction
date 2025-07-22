import { UserService } from './services/UserService.js';
import { USER_ROLE } from './models/constants.js';
import { showPage } from './utils/navigation.js';

export class AuthController {
  constructor() {
    this.userService = new UserService();
    this.loginBtn = document.getElementById('loginBtn');
    this.loginMessage = document.getElementById('loginMessage');
    this.usernameInput = document.getElementById('loginUsername');
    this.passwordInput = document.getElementById('loginPassword');

    this.logoutBtnMaster = document.getElementById('logoutBtnMaster');
    this.logoutBtnAuction = document.getElementById('logoutBtnAuction');

    this.initEvents();
  }

  initEvents() {
    // 로그인 처리
    this.loginBtn.addEventListener('click', () => this.handleLogin());

    // 로그아웃 처리
    this.logoutBtnMaster.addEventListener('click', () => this.handleLogout());
    this.logoutBtnAuction.addEventListener('click', () => this.handleLogout());
  }

  handleLogin() {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value.trim();

    if (!username || !password) {
      this.showMessage('아이디와 비밀번호를 입력하세요.', 'red');
      return;
    }

    const user = this.userService.findByCredentials(username, password);
    if (!user) {
      this.showMessage('잘못된 아이디 또는 비밀번호입니다.', 'red');
      return;
    }

    sessionStorage.setItem('currentUser', JSON.stringify(user));
    this.showMessage('', ''); // 메시지 초기화
    this.usernameInput.value = '';
    this.passwordInput.value = '';

    // 역할에 따라 페이지 이동
    showPage(user.role === USER_ROLE.MASTER ? 'masterPage' : 'auctionPage');
  }

  handleLogout() {
    sessionStorage.removeItem('currentUser');
    showPage('loginPage');
    this.showMessage('로그아웃되었습니다.', 'green');
  }

  showMessage(text, type = 'green') {
    this.loginMessage.textContent = text;
    this.loginMessage.className = `message ${type}`;
  }
}
