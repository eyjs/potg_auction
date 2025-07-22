import { MasterController } from './controllers/MasterController.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginPage = document.getElementById('loginPage');
  const masterPage = document.getElementById('masterPage');

  // 로그인 후 마스터 페이지로
  document.getElementById('loginBtn').addEventListener('click', () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (username === 'master' && password === 'master') {
      loginPage.classList.remove('active');
      masterPage.classList.add('active');
      new MasterController();
    } else {
      document.getElementById('loginMessage').textContent = '아이디 또는 비밀번호 오류';
    }
  });
});
