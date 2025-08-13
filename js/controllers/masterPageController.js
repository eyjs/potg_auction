import * as dom from '../../domRefs.js';

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
  setupDragAndDrop();

  dom.registerUserBtn.addEventListener('click', () => {
    const { registerUser } = window.Store.actions;
    const result = registerUser(
      dom.regUsernameInput.value.trim(),
      dom.regPasswordInput.value.trim(),
      dom.regUserImage.value.trim()
    );
    dom.regUserMessage.textContent = result.message;
    dom.regUserMessage.className = result.success ? 'message green' : 'message red';
    if (result.success) {
      dom.regUsernameInput.value = '';
      dom.regPasswordInput.value = '';
      dom.regUserImage.value = '';
    }
  });

  dom.createTeamBtn.addEventListener('click', () => {
    const { createTeam } = window.Store.actions;
    const result = createTeam(dom.teamNameInput.value.trim());
    dom.createTeamMessage.textContent = result.message;
    dom.createTeamMessage.className = result.success ? 'message green' : 'message red';
    if (result.success) dom.teamNameInput.value = '';
  });

  dom.addItemBtn.addEventListener('click', () => {
    const { addItem } = window.Store.actions;
    const result = addItem(
      dom.itemNameInput.value.trim(),
      dom.itemDescInput.value.trim(),
      dom.itemImageInput.value.trim()
    );
    dom.addItemMessage.textContent = result.message;
    dom.addItemMessage.className = result.success ? 'message green' : 'message red';
    if (result.success) {
      dom.itemNameInput.value = '';
      dom.itemDescInput.value = '';
      dom.itemImageInput.value = '';
    }
  });

  dom.createdTeamsList.addEventListener('click', (e) => {
    if (e.target.matches('button.delete')) {
      const teamId = e.target.dataset.teamId;
      if (confirm('정말 이 팀을 삭제하시겠습니까?')) {
        const result = window.Store.actions.deleteTeam(teamId);
        if (!result.success) alert(result.message);
      }
    }
  });

  dom.registeredItemsList.addEventListener('click', (e) => {
    if (e.target.matches('button.delete')) {
      const itemId = e.target.dataset.itemId;
      const result = window.Store.actions.deleteItem(itemId);
      if (!result.success) alert(result.message);
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

  dom.uploadJsonItemBtn.addEventListener('click', () => {
    handleFileUpload(
      dom.jsonItemUploadInput.files[0],
      dom.bulkItemMessage,
      window.Store.actions.bulkAddItemsFromUsernames
    );
  });

  dom.downloadSampleUserJsonBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = `./${SAMPLE_USER_JSON}`;
    a.download = SAMPLE_USER_JSON;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  dom.downloadSampleItemJsonBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = `./${SAMPLE_USER_JSON}`;
    a.download = SAMPLE_USER_JSON;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  dom.scaffoldBtn.addEventListener('click', () => {
    if (confirm('기존 데이터를 모두 초기화하고 테스트 데이터를 생성하시겠습니까?')) {
      const result = window.Store.actions.scaffoldData();
      dom.scaffoldMessage.textContent = result.message;
      dom.scaffoldMessage.className = 'message green';
    }
  });
}
