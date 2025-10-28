import * as dom from '../../domRefs.js';
import { showPage } from '../views/sharedView.js';

const SAMPLE_USER_JSON = 'sample.json';

function handleFileUpload(file, messageElement, action) {
  if (!file) {
    messageElement.textContent = '파일을 선택해주세요.';
    messageElement.className = 'message red';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('JSON 형식이 배열이 아닙니다.');
      const result = action(data);
      messageElement.textContent = result.message;
      messageElement.className = result.success ? 'message green' : 'message red';
    } catch (error) {
      messageElement.textContent = '오류: ' + error.message;
      messageElement.className = 'message red';
    }
  };
  reader.readAsText(file);
}

function setupDragAndDrop() {
  dom.availableUsersList.addEventListener('dragstart', (e) => {
    if (e.target.matches('.draggable-user')) {
      e.dataTransfer.setData('text/plain', e.target.dataset.userId);
    }
  });

  dom.dndTeamsList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const target = e.target.closest('.dnd-team-item');
    if (target) target.classList.add('drag-over');
  });

  dom.dndTeamsList.addEventListener('dragleave', (e) => {
    const target = e.target.closest('.dnd-team-item');
    if (target) target.classList.remove('drag-over');
  });

  dom.dndTeamsList.addEventListener('drop', (e) => {
    e.preventDefault();
    const target = e.target.closest('.dnd-team-item');
    if (target) {
      target.classList.remove('drag-over');
      const teamId = target.dataset.teamId;
      const userId = e.dataTransfer.getData('text/plain');
      window.Store.actions.assignTeamLeader(userId, teamId);
      dom.dndAssignMessage.textContent = `팀장이 배정되었습니다.`;
      dom.dndAssignMessage.className = 'message green';
    }
  });
}

export function initMasterPageController() {
  dom.goToAuctionPageBtn.addEventListener('click', () => showPage('auctionPage'));
  setupDragAndDrop();

  dom.registerUserBtn.addEventListener('click', () => {
    const result = window.Store.actions.registerUser(
      dom.regUsernameInput.value.trim(),
      dom.regUserImage.value.trim()
    );
    dom.regUserMessage.textContent = result.message;
    dom.regUserMessage.className = result.success ? 'message green' : 'message red';
    if (result.success) {
      dom.regUsernameInput.value = '';
      dom.regUserImage.value = '';
    }
  });

  dom.createTeamBtn.addEventListener('click', () => {
    const result = window.Store.actions.createTeam(dom.teamNameInput.value.trim());
    dom.createTeamMessage.textContent = result.message;
    dom.createTeamMessage.className = result.success ? 'message green' : 'message red';
    if (result.success) dom.teamNameInput.value = '';
  });

  dom.createdTeamsList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const teamId = button.dataset.teamId;
    const action = button.dataset.action;

    if (action === 'delete-team') {
      if (confirm('정말 이 팀을 삭제하시겠습니까? 팀에 속한 모든 정보가 변경됩니다.')) {
        window.Store.actions.deleteTeam(teamId);
      }
    } else if (action === 'release-leader') {
      if (confirm('이 팀의 팀장을 해제하시겠습니까?')) {
        window.Store.actions.releaseTeamLeader(teamId);
      }
    }
  });

  dom.saveSettingsBtn.addEventListener('click', () => {
    const duration = parseInt(dom.auctionDurationInput.value, 10);
    const extraTime = parseInt(dom.bidExtraTimeInput.value, 10);
    if (isNaN(duration) || duration <= 0 || isNaN(extraTime) || extraTime <= 0) {
      dom.settingsMessage.textContent = '유효한 양수 값을 입력하세요.';
      dom.settingsMessage.className = 'message red';
      return;
    }
    window.Store.actions.saveSettings(duration, extraTime);
    dom.settingsMessage.textContent = '설정이 저장되었습니다.';
    dom.settingsMessage.className = 'message green';
  });

  dom.resetDataBtn.addEventListener('click', () => {
    if (confirm('⚠ 모든 경매 데이터를 초기화합니다. 되돌릴 수 없습니다. 계속하시겠습니까?')) {
      window.Store.actions.resetAllData();
      alert('데이터가 초기화되었습니다.');
    }
  });

  dom.uploadJsonUserBtn.addEventListener('click', () => {
    handleFileUpload(dom.jsonUserUploadInput.files[0], dom.bulkUserMessage, window.Store.actions.bulkAddUsersAndItems);
  });

  dom.downloadSampleUserJsonBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = `./${SAMPLE_USER_JSON}`;
    a.download = SAMPLE_USER_JSON;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  dom.scaffoldBtn.addEventListener('click', async () => {
    if (confirm('기존 데이터를 모두 초기화하고 테스트 데이터를 생성하시겠습니까?')) {
      const result = await window.Store.actions.scaffoldData();
      dom.scaffoldMessage.textContent = result.message;
      dom.scaffoldMessage.className = result.success ? 'message green' : 'message red';
    }
  });
}
