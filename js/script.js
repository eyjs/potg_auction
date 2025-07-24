/* 상수 정리 */
const maxTeamItems = 4; // 팀당 최대 매물 수

// 사용자 역할 상수`
const USER_ROLE = {
  MASTER: 'master',
  TEAM_LEADER: 'teamLeader',
  GENERAL: 'general',
};

/* 모델 */
// --- 데이터 모델 (클라이언트 로컬 저장소 활용) ---
let users = JSON.parse(localStorage.getItem('users')) || [];
let teams = JSON.parse(localStorage.getItem('teams')) || [];
let items = JSON.parse(localStorage.getItem('items')) || [];

let auctionState = JSON.parse(localStorage.getItem('auctionState')) || {
  currentAuctionItemIndex: -1,
  timer: 30,
  intervalId: null,
  currentBid: 0,
  currentBidderTeamId: null,
  isAuctionRunning: false,
  isAuctionPaused: true,
  currentAuctionStartTime: 0,
  auctionDuration: 30,
  bidExtraTime: 10,
};

// 현재 로그인한 사용자 정보 (sessionStorage에 저장)
let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;

// --- DOM 요소 참조 ---
const loginPage = document.getElementById('loginPage');
const masterPage = document.getElementById('masterPage');
const auctionPage = document.getElementById('auctionPage');
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');
const masterUsernameDisplay = document.getElementById('masterUsernameDisplay');
const auctionUsernameDisplay = document.getElementById('auctionUsernameDisplay');
const logoutBtnMaster = document.getElementById('logoutBtnMaster');
const logoutBtnAuction = document.getElementById('logoutBtnAuction');
const goToAuctionPageBtn = document.getElementById('goToAuctionPageBtn');
const goToMasterPageBtn = document.getElementById('goToMasterPageBtn');
const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
const regUserImage = document.getElementById('regUserImage');
const registerUserBtn = document.getElementById('registerUserBtn');
const regUserMessage = document.getElementById('regUserMessage');
const scaffoldBtn = document.getElementById('scaffoldBtn');
const scaffoldMessage = document.getElementById('scaffoldMessage');
const jsonUserUploadInput = document.getElementById('jsonUserUploadInput');
const uploadJsonUserBtn = document.getElementById('uploadJsonUserBtn');
const downloadSampleUserJsonBtn = document.getElementById('downloadSampleUserJsonBtn');
const bulkUserMessage = document.getElementById('bulkUserMessage');
const teamNameInput = document.getElementById('teamNameInput');
const createTeamBtn = document.getElementById('createTeamBtn');
const createTeamMessage = document.getElementById('createTeamMessage');
const createdTeamsList = document.getElementById('createdTeamsList');
const availableUsersList = document.getElementById('availableUsersList');
const dndTeamsList = document.getElementById('dndTeamsList');
const dndAssignMessage = document.getElementById('dndAssignMessage');
const currentTeamLeadersList = document.getElementById('currentTeamLeadersList');
const itemNameInput = document.getElementById('itemNameInput');
const itemDescInput = document.getElementById('itemDescInput');
const itemImageInput = document.getElementById('itemImageInput');
const addItemBtn = document.getElementById('addItemBtn');
const addItemMessage = document.getElementById('addItemMessage');
const registeredItemsList = document.getElementById('registeredItemsList');
const jsonItemUploadInput = document.getElementById('jsonItemUploadInput');
const uploadJsonItemBtn = document.getElementById('uploadJsonItemBtn');
const downloadSampleItemJsonBtn = document.getElementById('downloadSampleItemJsonBtn');
const bulkItemMessage = document.getElementById('bulkItemMessage');
const auctionMasterMessage = document.getElementById('auctionMasterMessage');
const auctionDurationInput = document.getElementById('auctionDurationInput');
const bidExtraTimeInput = document.getElementById('bidExtraTimeInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingsMessage = document.getElementById('settingsMessage');
const teamListContainer = document.getElementById('teamListContainer');
const noItemMessage = document.getElementById('noItemMessage');
const currentItemName = document.getElementById('currentItemName');
const currentItemDescription = document.getElementById('currentItemDescription');
const currentItemImage = document.getElementById('currentItemImage');
const currentBidInfo = document.getElementById('currentBidInfo');
const currentBidValue = document.getElementById('currentBidValue');
const currentBidTeam = document.getElementById('currentBidTeam');
const timeCountDisplay = document.getElementById('timeCount');
const participantGrid = document.getElementById('participantGrid');
const auctionResultsSection = document.getElementById('auctionResultsSection');
const downloadTeamResultsBtn = document.getElementById('downloadTeamResultsBtn');
const downloadJsonDataBtn = document.getElementById('downloadJsonDataBtn');
const auctionPageMasterControls = document.getElementById('auctionPageMasterControls');
const auctionPageStartAuctionBtn = document.getElementById('auctionPageStartAuctionBtn');
const auctionPageNextAuctionBtn = document.getElementById('auctionPageNextAuctionBtn');
const auctionPageStopAuctionBtn = document.getElementById('auctionPageStopAuctionBtn');
const auctionPageEndAuctionBtn = document.getElementById('auctionPageEndAuctionBtn');
const addTimeBtnAuctionPage = document.getElementById('addTimeBtnAuctionPage');
const auctionPageMasterMessage = document.getElementById('auctionPageMasterMessage');
const unbidItemAssignmentAuctionPage = document.getElementById('unbidItemAssignmentAuctionPage');
const unbidItemsListAuctionPage = document.getElementById('unbidItemsListAuctionPage');
const unbidItemsTeamsListAuctionPage = document.getElementById('unbidItemsTeamsListAuctionPage');
const unbidItemAssignMessageAuctionPage = document.getElementById('unbidItemAssignMessageAuctionPage');
const teamInfoModal = document.getElementById('teamInfoModal');
const modalCloseBtn = document.querySelector('.modal-close-btn');
const modalTeamName = document.getElementById('modalTeamName');
const modalTeamMembers = document.getElementById('modalTeamMembers');

// --- 이미지 URL 생성 헬퍼 ---
function getUserImageUrl(user) {
  // 사용자 객체에 이미지 경로가 있으면 사용, 없으면 랜덤 SVG 생성
  return (
    user?.image || `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(user?.username || 'default')}`
  );
}

function getItemImageUrl(item) {
  // 아이템 객체에 이미지 경로가 있으면 사용
  if (item?.image) return item.image;
  // 아이템이 참가자와 연결되어 있으면 해당 참가자의 이미지 사용
  if (item?.participantId) {
    const user = users.find((u) => u.id === item.participantId);
    if (user) return getUserImageUrl(user);
  }
  // 모두 없으면 아이템 이름 기반으로 랜덤 SVG 생성
  return `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(item?.name || 'default')}`;
}

// --- 초기 데이터 설정 ---
function initializeData() {
  if (!users.some((u) => u.id === 'master' && u.role === USER_ROLE.MASTER)) {
    users.push({ id: 'master', username: 'master', password: 'master', role: USER_ROLE.MASTER, image: null });
    saveData();
  }
}

// --- 데이터 저장 및 로드 ---
function saveData() {
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('teams', JSON.stringify(teams));
  localStorage.setItem('items', JSON.stringify(items));
  localStorage.setItem('auctionState', JSON.stringify(auctionState));
}

function loadData() {
  users = JSON.parse(localStorage.getItem('users')) || [];
  teams = JSON.parse(localStorage.getItem('teams')) || [];
  items = JSON.parse(localStorage.getItem('items')) || [];
  const storedAuctionState = JSON.parse(localStorage.getItem('auctionState'));
  if (storedAuctionState) {
    Object.assign(auctionState, storedAuctionState);
    if (auctionState.isAuctionRunning && !auctionState.isAuctionPaused && auctionState.currentAuctionItemIndex !== -1) {
      const timeElapsed = Math.floor((Date.now() - auctionState.currentAuctionStartTime) / 1000);
      auctionState.timer = Math.max(0, auctionState.timer - timeElapsed);
      if (auctionState.timer > 0) {
        startTimer();
      } else {
        if (currentUser && currentUser.role === USER_ROLE.MASTER) {
          handleAuctionEndRound();
        }
      }
    }
  }
}

// --- 페이지 전환 ---
function showPage(pageId) {
  document.querySelectorAll('.page-container').forEach((page) => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');

  // ② 경매용 레이아웃 클래스/스타일 초기화 --------------------
  document.body.classList.remove('auction-running', 'auction-ended');
  // 혹시 남아 있을 scale 제거
  const wrap = document.querySelector('.auction-wrapper');
  if (wrap) wrap.style.transform = 'none';
  // body 스크롤 복원
  document.body.style.overflowY = 'auto';

  if (pageId === 'auctionPage') {
    auctionUsernameDisplay.textContent = currentUser ? currentUser.username : '게스트';
    goToMasterPageBtn.style.display = currentUser && currentUser.role === USER_ROLE.MASTER ? 'inline-block' : 'none';
    renderAuctionPage();
  } else if (pageId === 'masterPage') {
    masterUsernameDisplay.textContent = currentUser ? currentUser.username : '게스트';
    renderMasterPage();
  }

  document.body.classList.toggle('login-page', pageId === 'loginPage');
}

// --- 로그인 및 로그아웃 ---
loginBtn.addEventListener('click', () => {
  const username = loginUsernameInput.value;
  const password = loginPasswordInput.value;
  const user = users.find((u) => u.username === username && u.password === password);

  if (user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    loginMessage.textContent = '';
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    showPage(user.role === USER_ROLE.MASTER ? 'masterPage' : 'auctionPage');
  } else {
    loginMessage.textContent = '잘못된 사용자 이름 또는 비밀번호입니다.';
    loginMessage.classList.add('red');
  }
});

function resetAllData() {
  if (!confirm('⚠ 모든 경매 데이터를 초기화합니다.\n되돌릴 수 없습니다. 계속하시겠습니까?')) return;

  // 타이머가 돌고 있으면 중단
  if (auctionState.intervalId) clearInterval(auctionState.intervalId);

  // 핵심 키만 제거(다른 로컬스토리지 값 보호)
  ['users', 'teams', 'items', 'auctionState'].forEach((k) => localStorage.removeItem(k));

  alert('데이터가 초기화되었습니다.');
  location.reload(); // 새로고침하여 완전히 깨끗한 상태로
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  if (auctionState.intervalId) {
    clearInterval(auctionState.intervalId);
    auctionState.intervalId = null;
  }
  showPage('loginPage');
  loginMessage.textContent = '로그아웃 되었습니다.';
  loginMessage.classList.add('green');
}

logoutBtnMaster.addEventListener('click', logout);
logoutBtnAuction.addEventListener('click', logout);

goToAuctionPageBtn.addEventListener('click', () => showPage('auctionPage'));
goToMasterPageBtn.addEventListener('click', () => showPage('masterPage'));

// --- 마스터 페이지 기능 ---
function renderMasterPage() {
  if (!currentUser || currentUser.role !== USER_ROLE.MASTER) return;
  masterUsernameDisplay.textContent = currentUser.username;
  updateMasterPageLists();
  loadSettings();
  scaffoldMessage.textContent = '';
  updateAuctionControls();
}

function updateMasterPageLists() {
  populateAvailableUsersList();
  populateDndTeamsList();
  updateTeamListMasterPage();
  updateRegisteredItemsList();
}

// --- 사용자 관리 ---
registerUserBtn.addEventListener('click', () => {
  const username = regUsernameInput.value.trim();
  const password = regPasswordInput.value.trim();
  const image = regUserImage.value.trim();

  if (!username || !password) {
    regUserMessage.textContent = '사용자 이름과 비밀번호를 입력하세요.';
    regUserMessage.classList.add('red');
    return;
  }
  if (users.some((u) => u.username === username)) {
    regUserMessage.textContent = '이미 존재하는 사용자 이름입니다.';
    regUserMessage.classList.add('red');
    return;
  }
  users.push({
    id: `user_${Date.now()}`,
    username,
    password,
    image: image || null,
    role: USER_ROLE.GENERAL,
    teamId: null,
    points: 10000,
  });
  saveData();
  regUserMessage.textContent = `사용자 '${username}'이(가) 등록되었습니다.`;
  regUserMessage.classList.remove('red');
  regUserMessage.classList.add('green');
  regUsernameInput.value = '';
  regPasswordInput.value = '';
  regUserImage.value = '';
  updateMasterPageLists();
});

// --- 사용자 일괄 등록 ---
function makeItemFromUser(user) {
  return {
    id: `item_${user.id}`,
    name: user.username,
    description: `참가자 ${user.username}`,
    image: getUserImageUrl(user), // 기존 아바타 재사용(함수는 원래 있던 것)
    status: 'pending', // 경매 대기
    participantId: user.id,
    bidPrice: 0,
    bidderTeamId: null,
  };
}

/* === 수정된 handleBulkUserUpload ================= */
function handleBulkUserUpload(file) {
  if (!file) {
    bulkUserMessage.textContent = '파일을 선택해주세요.';
    bulkUserMessage.classList.add('red');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const uploadedUsers = JSON.parse(e.target.result);
      if (!Array.isArray(uploadedUsers)) throw new Error('JSON 형식이 배열이 아닙니다.');

      let addedUserCount = 0; // 새로 추가된 사용자 수
      let skippedUserCount = 0; // 중복 사용자 수
      let addedItemCount = 0; // 새로 생성된 매물 수

      uploadedUsers.forEach((u) => {
        if (!(u.username && u.password)) return; // 필수값 없으면 건너뜀

        /* 1) 사용자 중복 확인 */
        let userObj = users.find((ex) => ex.username === u.username);

        if (userObj) {
          skippedUserCount++; // 이미 존재
        } else {
          /* 2) 새 사용자 등록 */
          userObj = {
            id: `user_${Date.now()}_${u.username}`,
            username: u.username,
            password: u.password,
            image: u.image || null,
            role: USER_ROLE.GENERAL,
            teamId: null,
            points: 10000,
          };
          users.push(userObj);
          addedUserCount++;
        }

        /* 3) 매물 자동 생성 (중복 방지) */
        if (!items.some((it) => it.participantId === userObj.id)) {
          items.push(makeItemFromUser(userObj));
          addedItemCount++;
        }
      });

      /* 4) 저장 & UI 갱신 */
      saveData();
      updateMasterPageLists();

      bulkUserMessage.textContent =
        `${addedUserCount}명 추가, ${skippedUserCount}명 중복, ` + `매물 ${addedItemCount}건 생성 완료`;
      bulkUserMessage.className = 'message green';
      jsonUserUploadInput.value = ''; // 파일 입력 초기화
    } catch (error) {
      bulkUserMessage.textContent = '오류: ' + error.message;
      bulkUserMessage.className = 'message red';
    }
  };

  reader.readAsText(file);
}
downloadSampleUserJsonBtn.addEventListener('click', () => {
  const sampleData = [
    { username: 'newUser1', password: 'password123', image: 'images/photo1.jpg' },
    { username: 'newUser2', password: 'password456', image: '' },
  ];
  const jsonString = JSON.stringify(sampleData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_users.json';
  a.click();
  URL.revokeObjectURL(url);
});

// --- 팀 관리 ---
createTeamBtn.addEventListener('click', () => {
  const teamName = teamNameInput.value.trim();
  if (!teamName) {
    createTeamMessage.textContent = '팀 이름을 입력하세요.';
    createTeamMessage.classList.add('red');
    return;
  }
  if (teams.some((t) => t.name === teamName)) {
    createTeamMessage.textContent = '이미 존재하는 팀 이름입니다.';
    createTeamMessage.classList.add('red');
    return;
  }
  teams.push({ id: `team_${Date.now()}`, name: teamName, leaderId: null, points: 10000, itemsWon: [] });
  saveData();
  createTeamMessage.textContent = `팀 '${teamName}'이(가) 생성되었습니다.`;
  createTeamMessage.classList.remove('red');
  createTeamMessage.classList.add('green');
  teamNameInput.value = '';
  updateMasterPageLists();
});

function updateTeamListMasterPage() {
  createdTeamsList.innerHTML = '';
  teams.forEach((team) => {
    const leader = users.find((u) => u.id === team.leaderId);
    createdTeamsList.innerHTML += `
    <li>
      <span>${team.name} (팀장: ${leader ? leader.username : '없음'})</span>
      <button class="delete" onclick="deleteTeam('${team.id}')">삭제</button>
    </li>`;
  });

  currentTeamLeadersList.innerHTML = '';
  teams
    .filter((t) => t.leaderId)
    .forEach((team) => {
      const leader = users.find((u) => u.id === team.leaderId);
      if (leader) {
        currentTeamLeadersList.innerHTML += `<li><span>${team.name} - ${leader.username}</span><button class="delete" onclick="removeTeamLeader('${team.id}')">해제</button></li>`;
      }
    });
}

function removeTeamLeader(teamId) {
  const team = teams.find((t) => t.id === teamId);
  if (!team || !team.leaderId) return;
  const leader = users.find((u) => u.id === team.leaderId);
  if (leader) {
    leader.role = USER_ROLE.GENERAL;
  }
  team.leaderId = null;
  saveData();
  updateMasterPageLists();
}

function deleteTeam(teamId) {
  // 진행 중 경매 보호
  if (auctionState.isAuctionRunning) {
    createTeamMessage.textContent = '경매 중에는 팀을 삭제할 수 없습니다.';
    createTeamMessage.classList.add('red');
    return;
  }

  const idx = teams.findIndex((t) => t.id === teamId);
  if (idx === -1) return;
  const team = teams[idx];

  // 1) 삭제 불가 검증
  if (team.itemsWon.length > 0) {
    createTeamMessage.textContent = '낙찰된 매물이 있는 팀은 삭제할 수 없습니다.';
    createTeamMessage.classList.add('red');
    return;
  }
  const members = users.filter((u) => u.teamId === teamId);
  if (members.length > 0) {
    createTeamMessage.textContent = '팀원 배정이 남아 있습니다. 먼저 해제하세요.';
    createTeamMessage.classList.add('red');
    return;
  }

  // 2) 최종 확인
  if (!confirm(`'${team.name}' 팀을 정말 삭제하시겠습니까?`)) return;

  // 3) 팀장 복구
  if (team.leaderId) {
    const leader = users.find((u) => u.id === team.leaderId);
    if (leader) {
      leader.role = USER_ROLE.GENERAL;
      leader.teamId = null;
    }
  }

  // 4) 팀에게 귀속된 아이템 롤백
  items.forEach((item) => {
    if (item.bidderTeamId === teamId) {
      item.status = 'unsold';
      item.bidderTeamId = null;
      item.bidPrice = 0;
    }
  });

  // 5) teams 배열에서 제거
  teams.splice(idx, 1);

  saveData();
  updateMasterPageLists();

  createTeamMessage.textContent = '팀이 삭제되었습니다.';
  createTeamMessage.classList.remove('red');
  createTeamMessage.classList.add('green');
  setTimeout(() => (createTeamMessage.textContent = ''), 3000);
}

// --- 매물 관리 ---
function handleBulkItemUpload(file) {
  if (!file) {
    bulkItemMessage.textContent = '파일을 선택해주세요.';
    bulkItemMessage.classList.add('red');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const usernames = JSON.parse(e.target.result);
      if (!Array.isArray(usernames)) throw new Error('JSON 형식이 사용자 이름 배열이 아닙니다.');
      let addedCount = 0;
      let skippedCount = 0;
      usernames.forEach((username) => {
        const user = users.find((u) => u.username === username && u.role === USER_ROLE.GENERAL);
        if (user && !items.some((i) => i.participantId === user.id)) {
          const newItem = {
            id: `item_${user.id}`,
            name: user.username,
            description: `참가자 ${user.username}`,
            image: getUserImageUrl(user),
            status: 'pending',
            participantId: user.id,
          };
          items.push(newItem);
          addedCount++;
        } else {
          skippedCount++;
        }
      });
      saveData();
      updateMasterPageLists();
      bulkItemMessage.textContent = `${addedCount}개의 매물이 추가되었습니다. (건너뜀: ${skippedCount}개)`;
      bulkItemMessage.className = 'message green';
      jsonItemUploadInput.value = '';
    } catch (error) {
      bulkItemMessage.textContent = '오류: ' + error.message;
      bulkItemMessage.className = 'message red';
    }
  };
  reader.readAsText(file);
}

downloadSampleItemJsonBtn.addEventListener('click', () => {
  const sampleData = ['user_1', 'user_2', 'user_3'];
  const jsonString = JSON.stringify(sampleData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_items.json';
  a.click();
  URL.revokeObjectURL(url);
});

addItemBtn.addEventListener('click', () => {
  const itemName = itemNameInput.value.trim();
  const itemDesc = itemDescInput.value.trim();
  const itemImage = itemImageInput.value.trim();

  if (!itemName) {
    addItemMessage.textContent = '매물 이름을 입력하세요.';
    addItemMessage.classList.add('red');
    return;
  }
  if (items.some((i) => i.name === itemName)) {
    addItemMessage.textContent = '이미 존재하는 매물 이름입니다.';
    addItemMessage.classList.add('red');
    return;
  }
  const newItem = {
    id: `item_${Date.now()}`,
    name: itemName,
    description: itemDesc,
    image: itemImage || null,
    bidPrice: 0,
    bidderTeamId: null,
    status: 'pending',
    participantId: null,
  };
  items.push(newItem);
  saveData();
  addItemMessage.textContent = `매물 '${itemName}'이(가) 등록되었습니다.`;
  addItemMessage.classList.remove('red');
  addItemMessage.classList.add('green');
  itemNameInput.value = '';
  itemDescInput.value = '';
  itemImageInput.value = '';
  updateMasterPageLists();
});

function updateRegisteredItemsList() {
  registeredItemsList.innerHTML = '';
  items.forEach((item) => {
    const displayName = item.participantId
      ? users.find((u) => u.id === item.participantId)?.username || '알 수 없는 참여자'
      : item.name;
    let statusText = '';
    if (item.status === 'sold') {
      statusText = `(판매 완료 - ${teams.find((t) => t.id === item.bidderTeamId)?.name || '팀 없음'})`;
    } else if (item.status === 'unsold') {
      statusText = '(유찰)';
    } else {
      statusText = '(경매 대기)';
    }
    registeredItemsList.innerHTML += `<li><span>${displayName} ${statusText}</span><button class="delete" onclick="deleteItem('${item.id}')">삭제</button></li>`;
  });
}

function deleteItem(itemId) {
  const itemIndex = items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return;

  if (auctionState.currentAuctionItemIndex !== -1 && items[auctionState.currentAuctionItemIndex].id === itemId) {
    addItemMessage.textContent = '현재 경매 중인 매물은 삭제할 수 없습니다.';
    addItemMessage.classList.add('red');
    return;
  }

  const itemToDelete = items[itemIndex];
  if (itemToDelete.participantId) {
    const associatedUser = users.find((u) => u.id === itemToDelete.participantId);
    if (associatedUser && (associatedUser.role === USER_ROLE.TEAM_LEADER || associatedUser.teamId !== null)) {
      addItemMessage.textContent = '팀에 배정된 참여자 매물은 삭제할 수 없습니다.';
      addItemMessage.classList.add('red');
      return;
    }
  }

  if (itemIndex < auctionState.currentAuctionItemIndex) {
    auctionState.currentAuctionItemIndex--;
  }

  items.splice(itemIndex, 1);
  teams.forEach((team) => {
    team.itemsWon = team.itemsWon.filter((wonItemId) => wonItemId !== itemId);
  });

  saveData();
  updateMasterPageLists();
  addItemMessage.textContent = '매물이 삭제되었습니다.';
  addItemMessage.classList.add('green');
}

function populateAvailableUsersList() {
  availableUsersList.innerHTML = '';
  users
    .filter((u) => u.role === USER_ROLE.GENERAL && u.teamId === null)
    .forEach((user) => {
      const li = document.createElement('li');
      li.className = 'draggable-user';
      li.draggable = true;
      li.dataset.userId = user.id;
      li.textContent = user.username;
      li.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', e.target.dataset.userId));
      availableUsersList.appendChild(li);
    });
}

function populateDndTeamsList() {
  dndTeamsList.innerHTML = '';
  teams.forEach((team) => {
    const li = document.createElement('li');
    li.className = 'dnd-team-item';
    li.dataset.teamId = team.id;
    const leader = users.find((u) => u.id === team.leaderId);
    li.innerHTML = `<span><strong>${team.name}</strong></span><span>팀장: ${leader ? leader.username : '없음'}</span>`;
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      assignTeamLeaderDnd(e.dataTransfer.getData('text/plain'), e.target.closest('.dnd-team-item').dataset.teamId);
    });
    dndTeamsList.appendChild(li);
  });
}

function assignTeamLeaderDnd(userId, teamId) {
  const user = users.find((u) => u.id === userId);
  const team = teams.find((t) => t.id === teamId);
  if (!user || !team) return;

  const oldTeam = teams.find((t) => t.leaderId === user.id);
  if (oldTeam) oldTeam.leaderId = null;

  const oldLeader = users.find((u) => u.id === team.leaderId);
  if (oldLeader) {
    oldLeader.role = USER_ROLE.GENERAL;
  }

  team.leaderId = user.id;
  user.role = USER_ROLE.TEAM_LEADER;
  user.teamId = team.id;

  items = items.filter((item) => item.participantId !== user.id);

  saveData();
  dndAssignMessage.textContent = `'${user.username}'님이 '${team.name}' 팀의 팀장으로 설정되었습니다.`;
  dndAssignMessage.classList.add('green');
  updateMasterPageLists();
}

function populateUnbidItemsList(listElement) {
  listElement.innerHTML = '';
  users
    .filter((u) => u.role === USER_ROLE.GENERAL && u.teamId === null)
    .forEach((user) => {
      const li = document.createElement('li');
      li.className = 'draggable-item';
      li.draggable = true;
      li.dataset.userId = user.id;
      li.innerHTML = `<img src="${getUserImageUrl(
        user
      )}" style="width:24px; height:24px; border-radius:50%; margin-right:8px;"> ${user.username}`;
      li.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', e.target.dataset.userId));
      listElement.appendChild(li);
    });
}

function populateUnbidItemsTeamsList(listElement, messageElement) {
  listElement.innerHTML = '';
  teams.forEach((team) => {
    const li = document.createElement('li');
    li.className = 'dnd-team-item';
    li.dataset.teamId = team.id;
    li.innerHTML = `<strong>${team.name}</strong> <span>(${team.itemsWon.length}/${maxTeamItems})</span>`;
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      assignUnbidUserToTeam(
        e.dataTransfer.getData('text/plain'),
        e.target.closest('.dnd-team-item').dataset.teamId,
        messageElement
      );
    });
    listElement.appendChild(li);
  });
}

function assignUnbidUserToTeam(userId, teamId, messageElement) {
  const user = users.find((u) => u.id === userId);
  const team = teams.find((t) => t.id === teamId);
  if (!user || !team) return;

  if (user.teamId !== null) {
    renderAuctionPage();
    return;
  }

  if (team.itemsWon.length >= maxTeamItems) {
    messageElement.textContent = `${team.name} 팀은 가득 찼습니다.`;
    messageElement.classList.add('red');
    return;
  }
  let item = items.find((i) => i.participantId === user.id);
  if (!item) {
    item = {
      id: `item_manual_${user.id}`,
      name: user.username,
      participantId: user.id,
      status: 'sold',
      image: getUserImageUrl(user),
    };
    items.push(item);
  }
  item.status = 'sold';
  item.bidderTeamId = team.id;
  user.teamId = team.id;
  team.itemsWon.push(item.id);

  messageElement.textContent = `'${user.username}' 님이 '${team.name}' 팀에 배정되었습니다.`;
  messageElement.classList.add('green');

  saveData();
  renderAuctionPage();
}

function loadSettings() {
  auctionDurationInput.value = auctionState.auctionDuration || 30;
  bidExtraTimeInput.value = auctionState.bidExtraTime || 10;
}

function saveSettings() {
  const newDuration = parseInt(auctionDurationInput.value, 10);
  const newExtraTime = parseInt(bidExtraTimeInput.value, 10);

  if (isNaN(newDuration) || newDuration <= 0 || isNaN(newExtraTime) || newExtraTime <= 0) {
    settingsMessage.textContent = '유효한 양수 값을 입력하세요.';
    settingsMessage.classList.add('red');
    return;
  }

  auctionState.auctionDuration = newDuration;
  auctionState.bidExtraTime = newExtraTime;
  saveData();

  settingsMessage.textContent = '설정이 저장되었습니다.';
  settingsMessage.classList.remove('red');
  settingsMessage.classList.add('green');
  setTimeout(() => {
    settingsMessage.textContent = '';
  }, 3000);
}

scaffoldBtn.addEventListener('click', () => {
  if (!confirm('기존 데이터를 모두 초기화하고 테스트 데이터를 생성하시겠습니까?')) return;

  users = users.filter((u) => u.role === USER_ROLE.MASTER);
  teams = [];
  items = [];
  auctionState = {
    ...auctionState,
    currentAuctionItemIndex: -1,
    timer: auctionState.auctionDuration,
    intervalId: null,
    currentBid: 0,
    currentBidderTeamId: null,
    isAuctionRunning: false,
    isAuctionPaused: true,
  };

  for (let i = 1; i <= 20; i++)
    users.push({
      id: `user_${Date.now()}_${i}`,
      username: `user_${i}`,
      password: 'pw',
      image: null,
      role: USER_ROLE.GENERAL,
      teamId: null,
      points: 10000,
    });

  const teamNames = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
  teamNames.forEach((name, i) =>
    teams.push({ id: `team_${Date.now()}_${i}`, name: `Team ${name}`, leaderId: null, points: 10000, itemsWon: [] })
  );

  const generalUsers = users.filter((u) => u.role === USER_ROLE.GENERAL);
  const shuffledUsers = [...generalUsers].sort(() => 0.5 - Math.random());

  teams.forEach((team) => {
    const leader = shuffledUsers.pop();
    if (leader) {
      team.leaderId = leader.id;
      leader.role = USER_ROLE.TEAM_LEADER;
      leader.teamId = team.id;
    }
  });

  shuffledUsers.forEach((user) => {
    items.push({
      id: `item_${user.id}`,
      name: user.username,
      description: `참가자 ${user.username}`,
      image: getUserImageUrl(user),
      status: 'pending',
      participantId: user.id,
    });
  });

  saveData();
  updateMasterPageLists();
  scaffoldMessage.textContent = '스캐폴드 데이터가 생성되었습니다!';
  scaffoldMessage.classList.add('green');
});

// --- 경매 로직 ---
function isAuctionEndable() {
  return (
    items.every((item) => item.status !== 'pending') || teams.every((team) => team.itemsWon.length >= maxTeamItems)
  );
}

function handleStartAuction(messageElement) {
  if (isAuctionEndable() && !auctionState.isAuctionRunning) {
    if (!confirm('종료된 경매입니다. 데이터를 초기화하고 다시 시작하시겠습니까?')) return;
    items.forEach((i) => {
      i.status = 'pending';
      i.bidderTeamId = null;
      i.bidPrice = 0;
    });
    teams.forEach((t) => {
      t.itemsWon = [];
      t.points = 10000;
    });
    users.forEach((u) => {
      if (u.role !== USER_ROLE.MASTER && u.role !== USER_ROLE.TEAM_LEADER) {
        u.teamId = null;
      }
    });
  }
  auctionState = { ...auctionState, isAuctionRunning: true, isAuctionPaused: true, currentAuctionItemIndex: -1 };
  saveData();
  messageElement.textContent = '경매가 준비되었습니다. "다음 매물"을 클릭하세요.';
  messageElement.classList.add('green');
  updateAuctionControls();
  renderAuctionPage();
}

function handleEndAuction(messageElement) {
  if (auctionState.intervalId) clearInterval(auctionState.intervalId);
  auctionState.isAuctionRunning = false;
  auctionState.isAuctionPaused = true;

  endAuction();
  if (messageElement) {
    messageElement.textContent = '경매가 종료되었습니다. 유찰 인원을 배정해주세요.';
    messageElement.classList.add('green');
  }
}

function handleStopAuction(messageElement) {
  if (auctionState.intervalId) clearInterval(auctionState.intervalId);

  auctionState = {
    ...auctionState,
    currentAuctionItemIndex: -1,
    timer: 0,
    intervalId: null,
    currentBid: 0,
    currentBidderTeamId: null,
    isAuctionRunning: false,
    isAuctionPaused: true,
    currentAuctionStartTime: 0,
  };

  items.forEach((i) => {
    i.status = 'pending';
    i.bidderTeamId = null;
    i.bidPrice = 0;
  });
  teams.forEach((t) => {
    t.itemsWon = [];
    t.points = 10000;
  });
  users.forEach((u) => {
    if (u.role !== USER_ROLE.MASTER && u.role !== USER_ROLE.TEAM_LEADER) u.teamId = null;
  });

  saveData();
  messageElement.textContent = '경매가 초기화되었습니다.';
  messageElement.classList.add('orange');
  updateAuctionControls();
  renderAuctionPage();
}

function handleNextAuction() {
  if (items.every((item) => item.status !== 'pending')) {
    endAuction();
    return;
  }
  if (!auctionState.isAuctionRunning) return;
  startNextAuction();
}

function handleAddTime() {
  if (!currentUser || currentUser.role !== USER_ROLE.MASTER) return;
  if (auctionState.isAuctionRunning && !auctionState.isAuctionPaused && auctionState.timer > 0) {
    auctionState.timer += 10;
    saveData();
    timeCountDisplay.textContent = `남은 시간: ${String(auctionState.timer).padStart(2, '0')}초`;
    auctionPageMasterMessage.textContent = '+10초가 추가되었습니다.';
    auctionPageMasterMessage.classList.add('green');
    setTimeout(() => {
      auctionPageMasterMessage.textContent = '';
      auctionPageMasterMessage.classList.remove('green');
    }, 2000);
  } else {
    auctionPageMasterMessage.textContent = '경매 진행 중에만 시간을 추가할 수 있습니다.';
    auctionPageMasterMessage.classList.add('red');
    setTimeout(() => {
      auctionPageMasterMessage.textContent = '';
      auctionPageMasterMessage.classList.remove('red');
    }, 2000);
  }
}

auctionPageStartAuctionBtn.addEventListener('click', () => handleStartAuction(auctionPageMasterMessage));
auctionPageStopAuctionBtn.addEventListener('click', () => handleStopAuction(auctionPageMasterMessage));
auctionPageEndAuctionBtn.addEventListener('click', () => handleEndAuction(auctionPageMasterMessage));
auctionPageNextAuctionBtn.addEventListener('click', handleNextAuction);
addTimeBtnAuctionPage.addEventListener('click', handleAddTime);

function updateAuctionControls() {
  const isEnded = isAuctionEndable();
  const canStart = !auctionState.isAuctionRunning || isEnded;
  const canStop = auctionState.isAuctionRunning;
  const canNext = auctionState.isAuctionRunning && auctionState.isAuctionPaused && !isEnded;
  const canAddTime = auctionState.isAuctionRunning && !auctionState.isAuctionPaused;

  if (auctionPageStartAuctionBtn) auctionPageStartAuctionBtn.disabled = !canStart;
  if (auctionPageStopAuctionBtn) auctionPageStopAuctionBtn.disabled = !canStop;
  if (auctionPageEndAuctionBtn) auctionPageEndAuctionBtn.disabled = !canStop;
  if (auctionPageNextAuctionBtn) auctionPageNextAuctionBtn.disabled = !canNext;
  if (addTimeBtnAuctionPage) addTimeBtnAuctionPage.disabled = !canAddTime;
}

function startNextAuction() {
  if (auctionState.intervalId) clearInterval(auctionState.intervalId);
  const totalItems = items.length;
  if (totalItems === 0) {
    endAuction();
    return;
  }
  const startIndex = (auctionState.currentAuctionItemIndex + 1) % totalItems;
  let nextItem = null,
    nextItemIndex = -1;
  for (let i = 0; i < totalItems; i++) {
    const currentIndex = (startIndex + i) % totalItems;
    if (items[currentIndex].status === 'pending') {
      nextItem = items[currentIndex];
      nextItemIndex = currentIndex;
      break;
    }
  }
  if (nextItem) {
    auctionState = {
      ...auctionState,
      currentAuctionItemIndex: nextItemIndex,
      currentBid: 0,
      currentBidderTeamId: null,
      timer: auctionState.auctionDuration,
      isAuctionPaused: false,
      currentAuctionStartTime: Date.now(),
    };
    saveData();
    renderAuctionPage();
    updateAuctionControls();
    startTimer();
  } else {
    endAuction();
  }
}

function handleAuctionEndRound() {
  auctionState.isAuctionPaused = true;
  const currentItem = items[auctionState.currentAuctionItemIndex];
  if (!currentItem) {
    endAuction();
    return;
  }

  if (auctionState.currentBid > 0 && auctionState.currentBidderTeamId) {
    const winningTeam = teams.find((t) => t.id === auctionState.currentBidderTeamId);
    if (winningTeam && winningTeam.itemsWon.length < maxTeamItems) {
      const price = auctionState.currentBid;
      const itemName = currentItem.participantId
        ? users.find((u) => u.id === currentItem.participantId)?.username || currentItem.name
        : currentItem.name;

      showCustomAlert(
        `<b>${itemName}</b> 님이<br>
         <b>${winningTeam.name}</b> 팀에<br>
         <span style="font-size: 1.2em; color: var(--warning-color);">${price.toLocaleString()}P</span> 에 낙찰되었습니다!`,
        '낙찰 🎉'
      );

      winningTeam.points -= price;
      winningTeam.itemsWon.push(currentItem.id);
      currentItem.status = 'sold';
      currentItem.bidderTeamId = winningTeam.id;
      currentItem.bidPrice = price;
      if (currentItem.participantId) {
        const user = users.find((u) => u.id === currentItem.participantId);
        if (user) user.teamId = winningTeam.id;
      }
    } else {
      currentItem.status = 'unsold';
    }
  } else {
    currentItem.status = 'unsold';
  }

  saveData();

  if (isAuctionEndable()) {
    endAuction();
  } else {
    renderAuctionPage();
    updateAuctionControls();
  }
}

function endAuction() {
  if (auctionState.intervalId) clearInterval(auctionState.intervalId);
  auctionState.isAuctionRunning = false;
  auctionState.isEnded = true;
  items.forEach((item) => {
    if (item.status === 'pending') {
      item.status = 'unsold';
    }
  });

  saveData();
  showCustomAlert(`<b>모든 경매가 종료 되었습니다.</b><br/>아래로 스크롤하여 유찰 인원을 확인해주세요.`, '경매 종료');
  renderAuctionPage();
  updateAuctionControls();
}

function startTimer() {
  if (auctionState.intervalId) clearInterval(auctionState.intervalId);
  auctionState.intervalId = setInterval(() => {
    auctionState.timer--;
    timeCountDisplay.textContent = `남은 시간: ${String(auctionState.timer).padStart(2, '0')}초`;
    if (currentUser && currentUser.role === USER_ROLE.MASTER) saveData();
    if (auctionState.timer <= 0) {
      clearInterval(auctionState.intervalId);
      if (currentUser && currentUser.role === USER_ROLE.MASTER) handleAuctionEndRound();
    }
  }, 1000);
}

function showCustomAlert(message, title) {
  const oldModal = document.getElementById('customAlertModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'customAlertModal';
  modal.classList.add('modal-overlay');
  modal.innerHTML = `
      <div class="modal-content" style="max-width: 420px; text-align: center;">
        <div style="font-size:2.2em; margin-bottom:18px; color: var(--accent-color);"> ${title} </div>
        <div style="margin-bottom:24px; font-size: 1.2em; line-height: 1.6;">${message}</div>
        <button id="customAlertCloseBtn" class="primary-btn">확인</button>
      </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#customAlertCloseBtn').onclick = () => modal.remove();
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function masterBid(teamId, incrementAmount) {
  if (!currentUser || currentUser.role !== USER_ROLE.MASTER) return;
  const currentItem = items[auctionState.currentAuctionItemIndex];
  if (!currentItem || auctionState.timer <= 0 || auctionState.isAuctionPaused) return;
  const biddingTeam = teams.find((t) => t.id === teamId);
  if (!biddingTeam) return;

  if (biddingTeam.itemsWon.length >= maxTeamItems) {
    alert(`${biddingTeam.name} 팀은 이미 최대 매물을 보유하고 있습니다!`);
    return;
  }

  const newBid = auctionState.currentBid + incrementAmount;
  if (biddingTeam.points < newBid) {
    alert(`${biddingTeam.name} 팀의 포인트가 부족합니다!`);
    return;
  }

  auctionState.currentBid = newBid;
  auctionState.currentBidderTeamId = biddingTeam.id;
  auctionState.currentAuctionStartTime = Date.now();

  const potentialOpponents = teams.filter((team) => team.id !== teamId && team.itemsWon.length < maxTeamItems);

  const allOpponentsCantBid = potentialOpponents.every((team) => team.points <= newBid);

  if (allOpponentsCantBid) {
    auctionState.timer = 0;
    if (auctionState.intervalId) clearInterval(auctionState.intervalId);
    handleAuctionEndRound();
    return;
  }

  if (auctionState.timer <= 10) {
    auctionState.timer += auctionState.bidExtraTime;
  }

  saveData();
  updateBidInfo();
  renderParticipantGrid();
}

function renderAuctionPage() {
  renderTeamList();
  renderParticipantGrid();
  const currentItem = auctionState.currentAuctionItemIndex !== -1 ? items[auctionState.currentAuctionItemIndex] : null;
  updateAuctionDisplay(currentItem);
  updateAuctionControls();

  const auctionIsOver = isAuctionEndable();
  const hasUnbidUsers = users.some((u) => u.role === USER_ROLE.GENERAL && u.teamId === null);

  if (auctionIsOver && !auctionState.isAuctionRunning) {
    auctionResultsSection.style.display = 'block';
  } else {
    auctionResultsSection.style.display = 'none';
  }

  if (auctionIsOver && hasUnbidUsers && currentUser && currentUser.role === USER_ROLE.MASTER) {
    unbidItemAssignmentAuctionPage.style.display = 'flex';
    populateUnbidItemsList(unbidItemsListAuctionPage);
    populateUnbidItemsTeamsList(unbidItemsTeamsListAuctionPage, unbidItemAssignMessageAuctionPage);
  } else {
    unbidItemAssignmentAuctionPage.style.display = 'none';
  }

  const running = auctionState.isAuctionRunning; // 진행 중?
  const ended = !running && auctionState.isEnded; // 종료 후? (flag 하나 더 두는 게 편합니다)

  document.body.classList.toggle('auction-running', running);
  document.body.classList.toggle('auction-ended', ended);
}

function updateAuctionDisplay(item) {
  const isMaster = currentUser && currentUser.role === USER_ROLE.MASTER;
  auctionPageMasterControls.style.display = isMaster ? 'flex' : 'none';
  document.getElementById('bidButton').style.display = 'none';

  if (item && auctionState.isAuctionRunning && !auctionState.isAuctionPaused) {
    noItemMessage.style.display = 'none';
    currentItemImage.src = getItemImageUrl(item);
    currentItemImage.style.display = 'block';
    const displayName = item.participantId
      ? users.find((u) => u.id === item.participantId)?.username || '참여자'
      : item.name;
    currentItemName.textContent = `매물: ${displayName}`;
    currentItemDescription.textContent = item.description || '설명 없음';
    currentBidInfo.style.display = 'flex';
    updateBidInfo();
  } else {
    noItemMessage.style.display = 'block';
    currentItemImage.style.display = 'none';
    currentBidInfo.style.display = 'none';
    currentItemName.textContent = '경매 대기 중';
    currentItemDescription.textContent = isAuctionEndable()
      ? '경매가 모두 종료되었습니다.'
      : '마스터가 경매를 시작합니다.';
  }
}

function updateBidInfo() {
  const team = teams.find((t) => t.id === auctionState.currentBidderTeamId);
  currentBidValue.textContent = auctionState.currentBid.toLocaleString();
  currentBidTeam.textContent = team ? team.name : '없음';
  timeCountDisplay.textContent = `남은 시간: ${String(auctionState.timer).padStart(2, '0')}초`;
}

function showTeamInfoModal(teamId) {
  const team = teams.find((t) => t.id === teamId);
  if (!team) return;

  modalTeamName.textContent = `${team.name} 팀원 정보`;
  const members = users
    .filter((u) => u.teamId === teamId)
    .sort((a, b) => (b.role === USER_ROLE.TEAM_LEADER) - (a.role === USER_ROLE.TEAM_LEADER));

  let tableHTML = `<table class="modal-table">
                        <thead>
                            <tr>
                                <th>이미지</th>
                                <th>아이디</th>
                                <th>역할</th>
                                <th>낙찰가</th>
                            </tr>
                        </thead>
                        <tbody>`;

  if (members.length === 0) {
    tableHTML += `<tr><td colspan="4" style="text-align: center;">배정된 팀원이 없습니다.</td></tr>`;
  } else {
    members.forEach((member) => {
      const item = items.find((i) => i.participantId === member.id);
      const price = item ? item.bidPrice || 0 : 0;
      const roleText = member.role === USER_ROLE.TEAM_LEADER ? '팀장' : '팀원';
      const userImage = getUserImageUrl(member);
      const tooltipText = `이미지 URL: ${userImage}\n아이디: ${member.username}\n낙찰가격: ${price.toLocaleString()}P`;

      tableHTML += `<tr title="${tooltipText}">
                            <td><img src="${userImage}" alt="${member.username}"></td>
                            <td>${member.username}</td>
                            <td>${roleText}</td>
                            <td>${price.toLocaleString()} P</td>
                         </tr>`;
    });
  }

  tableHTML += `</tbody></table>`;
  modalTeamMembers.innerHTML = tableHTML;
  teamInfoModal.style.display = 'flex';
}

function renderTeamList() {
  teamListContainer.innerHTML = '';
  teams.forEach((team) => {
    const teamLeader = users.find((u) => u.id === team.leaderId);
    const teamItem = document.createElement('div');
    teamItem.classList.add('team-item');
    teamItem.dataset.teamId = team.id;
    const teamAvatarSrc = `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(team.name)}`;

    let masterBidButtonsHTML = '';
    if (
      currentUser &&
      currentUser.role === USER_ROLE.MASTER &&
      auctionState.isAuctionRunning &&
      !auctionState.isAuctionPaused
    ) {
      const bidIncrements = [100, 200, 500, 1000];
      masterBidButtonsHTML = `<div class="master-bid-btn-group">${bidIncrements
        .map(
          (amount) => `<button class="master-bid-btn" onclick="masterBid('${team.id}', ${amount})">+${amount}</button>`
        )
        .join('')}</div>`;
    }

    teamItem.innerHTML = `
      <div class="team-avatar" style="background-image: url(${teamAvatarSrc});"></div>
      <div class="team-info">
          <div class="team-name">${team.name}</div>
          <div class="team-points">리더: ${teamLeader ? teamLeader.username : '없음'}</div>
          <div class="team-points">포인트: ${team.points.toLocaleString()}P</div>
      </div>
      <div class="team-slots">${Array(maxTeamItems)
        .fill()
        .map((_, i) => `<div class="slot-indicator ${team.itemsWon.length > i ? 'filled' : ''}"></div>`)
        .join('')}</div>
      ${masterBidButtonsHTML}
    `;

    teamItem.addEventListener('click', (e) => {
      if (e.target.closest('.master-bid-btn')) return;
      showTeamInfoModal(team.id);
    });

    teamListContainer.appendChild(teamItem);
  });
}

function renderParticipantGrid() {
  participantGrid.innerHTML = '';
  const participants = users.filter((u) => u.role === USER_ROLE.GENERAL && items.some((i) => i.participantId === u.id));

  participants.forEach((user) => {
    const container = document.createElement('div');
    container.className = 'participant-container';

    const { password, ...userInfoForTooltip } = user;
    const tooltipText = Object.entries(userInfoForTooltip)
      .map(([key, value]) => `${key}: ${value === null ? 'N/A' : value}`)
      .join('\n');
    container.title = tooltipText;

    const avatar = document.createElement('div');
    avatar.className = 'participant-avatar';

    const nameLabel = document.createElement('span');
    nameLabel.className = 'participant-name';
    nameLabel.textContent = user.username;

    const item = items.find((i) => i.participantId === user.id);
    let statusLabel = null;

    if (item) {
      if (item.status === 'sold' || item.status === 'unsold') {
        avatar.classList.add(item.status);
        statusLabel = document.createElement('div');
        statusLabel.className = `participant-status-overlay ${item.status}`;
        statusLabel.textContent = item.status === 'sold' ? '낙찰' : '유찰';
      }
    }

    const currentItemOnAuction = items[auctionState.currentAuctionItemIndex];
    if (currentItemOnAuction && currentItemOnAuction.participantId === user.id) {
      avatar.classList.add('border-auction-item');
    }

    avatar.style.backgroundImage = `url(${getUserImageUrl(user)})`;

    container.appendChild(avatar);
    container.appendChild(nameLabel);
    if (statusLabel) container.appendChild(statusLabel);

    participantGrid.appendChild(container);
  });
}

downloadTeamResultsBtn.addEventListener('click', () => {
  let report = `
  <div style="background-color: #393e46; border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); width: 210mm; min-height: 297mm; margin: 0 auto; padding: 48px; font-family: 'Segoe UI', sans-serif; color: #eeeeee; border: 4px solid #00adb5; box-sizing: border-box;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 36px;">
      <h2 style="color: #00adb5; font-size: 2.2em; margin: 0;">경매 최종 결과</h2>
      <button id="printReportBtn" style="background: #00adb5; color: #222831; border: none; border-radius: 8px; padding: 10px 26px; font-size: 1.08em; font-weight: bold; cursor: pointer;">인쇄</button>
    </div>
    <table style="width: 100%; border-collapse: separate; border-spacing: 0; background: #222831; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background: #00adb5;">
          <th style="padding:18px; color:#fff;">팀명</th>
          <th style="padding:18px; color:#fff;">남은 포인트</th>
          <th style="padding:18px; color:#fff;">팀원 (포인트 사용 내역)</th>
        </tr>
      </thead>
      <tbody>
  `;
  teams.forEach((team) => {
    const leader = users.find((u) => u.id === team.leaderId);
    const members = users.filter((u) => u.teamId === team.id);
    report += `
      <tr>
        <td style="padding:16px; border-bottom:1px solid #4a4f57;">
          <strong style="font-size:1.12em; color:#00adb5;">${team.name}</strong><br>
          <span style="font-size:0.97em; color:#fff;">(리더: ${leader ? leader.username : '없음'})</span>
        </td>
        <td style="padding:16px; border-bottom:1px solid #4a4f57; color:#28a745; font-weight:bold;">
          ${team.points.toLocaleString()}P
        </td>
        <td style="padding:16px; border-bottom:1px solid #4a4f57;">
          <ul style="margin:0; padding-left:20px;">
            ${members
              .map((member) => {
                const wonItem = items.find(
                  (item) => item.participantId === member.id && item.status === 'sold' && item.bidderTeamId === team.id
                );
                const price = wonItem && typeof wonItem.bidPrice === 'number' ? wonItem.bidPrice : 0;
                const roleText =
                  member.role === USER_ROLE.TEAM_LEADER
                    ? ' <span style="color:#00adb5; font-weight:bold;">(팀장)</span>'
                    : '';
                return `<li style="margin-bottom:5px; color:#28a745">
                  <span style="color:#fff;">${member.username}${roleText}</span>
                  <span style="color:#dc3545; font-weight:bold;"> - ${price.toLocaleString()}P</span>
                </li>`;
              })
              .join('')}
          </ul>
        </td>
      </tr>
    `;
  });
  report += `
      </tbody>
    </table>
  </div>
  <script>
    document.getElementById('printReportBtn').onclick = () => window.print();
  </script>
  `;

  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(report);
  reportWindow.document.close();
});

downloadJsonDataBtn.addEventListener('click', () => {
  const data = { users, teams, items, auctionState };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `auction-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// --- 초기화 및 실행 ---
document.addEventListener('DOMContentLoaded', () => {
  initializeData();
  loadData();
  showPage(currentUser ? (currentUser.role === USER_ROLE.MASTER ? 'masterPage' : 'auctionPage') : 'loginPage');

  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
  if (uploadJsonUserBtn)
    uploadJsonUserBtn.addEventListener('click', () => handleBulkUserUpload(jsonUserUploadInput.files[0]));
  if (uploadJsonItemBtn)
    uploadJsonItemBtn.addEventListener('click', () => handleBulkItemUpload(jsonItemUploadInput.files[0]));

  // 모달 닫기 이벤트
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => (teamInfoModal.style.display = 'none'));
  if (teamInfoModal)
    teamInfoModal.addEventListener('click', (e) => {
      if (e.target === teamInfoModal) teamInfoModal.style.display = 'none';
    });
  document.getElementById('resetDataBtn')?.addEventListener('click', resetAllData);
  window.addEventListener('storage', (event) => {
    if (['users', 'teams', 'items', 'auctionState'].includes(event.key)) {
      loadData();
      if (document.getElementById('auctionPage').classList.contains('active')) {
        renderAuctionPage();
      } else if (document.getElementById('masterPage').classList.contains('active')) {
        renderMasterPage();
      }
    }
  });
});
