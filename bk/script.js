// --- 데이터 모델 (클라이언트 로컬 저장소 활용) ---
let users = JSON.parse(localStorage.getItem('users')) || [];
let teams = JSON.parse(localStorage.getItem('teams')) || [];
let items = JSON.parse(localStorage.getItem('items')) || [];

let auctionState = JSON.parse(localStorage.getItem('auctionState')) || {
  currentAuctionItemIndex: -1,
  timer: 0,
  intervalId: null, // setInterval ID
  currentBid: 0,
  currentBidderTeamId: null,
  isAuctionRunning: false, // 경매 전체가 시작되었는지 여부
  isAuctionPaused: true, // 현재 매물 경매가 일시정지 상태인지 여부 (예: 다음 매물 대기 중)
  currentAuctionStartTime: 0, // 경매가 시작된 시간 (리로드 시 타이머 동기화용)
};

// 사용자 역할 상수
const USER_ROLE = {
  MASTER: 'master',
  TEAM_LEADER: 'teamLeader',
  GENERAL: 'general',
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

const scaffoldBtn = document.getElementById('scaffoldBtn');
const scaffoldMessage = document.getElementById('scaffoldMessage');

const goToAuctionPageBtn = document.getElementById('goToAuctionPageBtn');
const goToMasterPageBtn = document.getElementById('goToMasterPageBtn');

const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
const registerUserBtn = document.getElementById('registerUserBtn');
const regUserMessage = document.getElementById('regUserMessage');

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

const masterStartAuctionBtn = document.getElementById('masterStartAuctionBtn');
const masterStopAuctionBtn = document.getElementById('masterStopAuctionBtn');
const masterNextAuctionBtn = document.getElementById('masterNextAuctionBtn');
const auctionMasterMessage = document.getElementById('auctionMasterMessage');

const teamListContainer = document.getElementById('teamListContainer');
const noItemMessage = document.getElementById('noItemMessage');
const currentItemName = document.getElementById('currentItemName');
const currentItemDescription = document.getElementById('currentItemDescription');
const currentItemImage = document.getElementById('currentItemImage');
const currentBidInfo = document.getElementById('currentBidInfo');
const currentBidValue = document.getElementById('currentBidValue');
const currentBidTeam = document.getElementById('currentBidTeam');
const timeCountDisplay = document.getElementById('timeCount');

const auctionPageMasterControls = document.getElementById('auctionPageMasterControls');
const auctionPageStartAuctionBtn = document.getElementById('auctionPageStartAuctionBtn');
const auctionPageNextAuctionBtn = document.getElementById('auctionPageNextAuctionBtn');
const auctionPageStopAuctionBtn = document.getElementById('auctionPageStopAuctionBtn');
const auctionPageMasterMessage = document.getElementById('auctionPageMasterMessage');

const participantGrid = document.getElementById('participantGrid');

const unbidItemAssignmentSection = document.getElementById('unbidItemAssignmentSection');
const unbidItemsListMasterPage = document.getElementById('unbidItemsListMasterPage');
const unbidItemsTeamsListMasterPage = document.getElementById('unbidItemsTeamsListMasterPage');
const unbidItemAssignMessageMasterPage = document.getElementById('unbidItemAssignMessageMasterPage');

const auctionResultsSection = document.getElementById('auctionResultsSection');
const downloadTeamResultsBtn = document.getElementById('downloadTeamResultsBtn');
const downloadJsonDataBtn = document.getElementById('downloadJsonDataBtn');

// --- 초기 데이터 설정 ---
function initializeData() {
  if (!users.some((u) => u.id === 'master' && u.role === USER_ROLE.MASTER)) {
    users.push({ id: 'master', username: 'master', password: 'master', role: USER_ROLE.MASTER });
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

  if (pageId === 'auctionPage') {
    auctionUsernameDisplay.textContent = currentUser ? currentUser.username : '게스트';
    goToMasterPageBtn.style.display = currentUser && currentUser.role === USER_ROLE.MASTER ? 'inline-block' : 'none';
    renderAuctionPage();
  } else if (pageId === 'masterPage') {
    masterUsernameDisplay.textContent = currentUser ? currentUser.username : '게스트';
    renderMasterPage();
  }
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
  scaffoldMessage.textContent = '';
  updateAuctionControls();

  if (isAuctionEndable() && !auctionState.isAuctionRunning) {
    unbidItemAssignmentSection.style.display = 'flex';
    populateUnbidItemsList(unbidItemsListMasterPage);
    populateUnbidItemsTeamsList(unbidItemsTeamsListMasterPage);
  } else {
    unbidItemAssignmentSection.style.display = 'none';
  }
}

function updateMasterPageLists() {
  populateAvailableUsersList();
  populateDndTeamsList();
  updateTeamListMasterPage();
  updateRegisteredItemsList();
  populateUnbidItemsList(unbidItemsListMasterPage);
  populateUnbidItemsTeamsList(unbidItemsTeamsListMasterPage);
}

registerUserBtn.addEventListener('click', () => {
  const username = regUsernameInput.value.trim();
  const password = regPasswordInput.value.trim();
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
  users.push({ id: `user_${Date.now()}`, username, password, role: USER_ROLE.GENERAL, teamId: null, points: 0 });
  saveData();
  regUserMessage.textContent = `사용자 '${username}'이(가) 등록되었습니다.`;
  regUserMessage.classList.remove('red');
  regUserMessage.classList.add('green');
  regUsernameInput.value = '';
  regPasswordInput.value = '';
  updateMasterPageLists();
});

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
  teams.push({ id: `team_${Date.now()}`, name: teamName, leaderId: null, points: 0, itemsWon: [] });
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
    createdTeamsList.innerHTML += `<li><span>${team.name} (팀장: ${leader ? leader.username : '없음'})</span></li>`;
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
    leader.teamId = null;
  }
  team.leaderId = null;
  saveData();
  updateMasterPageLists();
}

addItemBtn.addEventListener('click', () => {
  const itemName = itemNameInput.value.trim();
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
    description: itemDescInput.value.trim(),
    image:
      itemImageInput.value.trim() || `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(itemName)}`,
    bidPrice: 0,
    bidderTeamId: null,
    isSold: false,
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
    const status = item.isSold
      ? `(판매 완료 - ${teams.find((t) => t.id === item.bidderTeamId)?.name || '팀 없음'})`
      : '(경매 대기)';
    registeredItemsList.innerHTML += `<li><span>${displayName} ${status}</span><button class="delete" onclick="deleteItem('${item.id}')">삭제</button></li>`;
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

// --- 팀장 배정 D&D ---
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
  if (oldLeader) oldLeader.role = USER_ROLE.GENERAL;

  team.leaderId = user.id;
  user.role = USER_ROLE.TEAM_LEADER;

  items = items.filter((item) => item.participantId !== user.id);

  saveData();
  dndAssignMessage.textContent = `'${user.username}'님이 '${team.name}' 팀의 팀장으로 설정되었습니다.`;
  dndAssignMessage.classList.add('green');
  updateMasterPageLists();
}

// --- 유찰 매물 배정 D&D ---
function populateUnbidItemsList(listElement) {
  listElement.innerHTML = '';
  users
    .filter((u) => u.role === USER_ROLE.GENERAL && u.teamId === null)
    .forEach((user) => {
      const li = document.createElement('li');
      li.className = 'draggable-item';
      li.draggable = true;
      li.dataset.userId = user.id;
      li.innerHTML = `<img src="https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(
        user.username
      )}" style="width:24px; height:24px; border-radius:50%; margin-right:8px;"> ${user.username}`;
      li.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', e.target.dataset.userId));
      listElement.appendChild(li);
    });
}

function populateUnbidItemsTeamsList(listElement) {
  listElement.innerHTML = '';
  teams.forEach((team) => {
    const li = document.createElement('li');
    li.className = 'dnd-team-item';
    li.dataset.teamId = team.id;
    li.innerHTML = `<strong>${team.name}</strong> <span>(${team.itemsWon.length}/5)</span>`;
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
        unbidItemAssignMessageMasterPage
      );
    });
    listElement.appendChild(li);
  });
}

function assignUnbidUserToTeam(userId, teamId, messageElement) {
  const user = users.find((u) => u.id === userId);
  const team = teams.find((t) => t.id === teamId);
  if (!user || !team) return;
  if (team.itemsWon.length >= 5) {
    messageElement.textContent = `${team.name} 팀은 가득 찼습니다.`;
    messageElement.classList.add('red');
    return;
  }
  let item = items.find((i) => i.participantId === user.id);
  if (!item) {
    item = { id: `item_manual_${user.id}`, name: user.username, participantId: user.id };
    items.push(item);
  }
  item.isSold = true;
  item.bidderTeamId = team.id;
  user.teamId = team.id;
  team.itemsWon.push(item.id);
  saveData();
  messageElement.textContent = `'${user.username}' 님이 '${team.name}' 팀에 배정되었습니다.`;
  messageElement.classList.add('green');
  updateMasterPageLists();
}

// --- 스캐폴드 ---
scaffoldBtn.addEventListener('click', () => {
  if (!confirm('기존 데이터를 모두 초기화하고 테스트 데이터를 생성하시겠습니까?')) return;

  users = users.filter((u) => u.role === USER_ROLE.MASTER);
  teams = [];
  items = [];
  auctionState = {
    currentAuctionItemIndex: -1,
    timer: 0,
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
    }
  });

  shuffledUsers.forEach((user) => {
    items.push({
      id: `item_${user.id}`,
      name: user.username,
      description: `참가자 ${user.username}`,
      image: `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
      isSold: false,
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
  return items.every((item) => item.isSold) || teams.every((team) => team.itemsWon.length >= 5);
}

function handleStartAuction(messageElement) {
  if (isAuctionEndable() && !auctionState.isAuctionRunning) {
    if (!confirm('종료된 경매입니다. 데이터를 초기화하고 다시 시작하시겠습니까?')) return;
    items.forEach((i) => {
      i.isSold = false;
      i.bidderTeamId = null;
      i.bidPrice = 0;
    });
    teams.forEach((t) => {
      t.itemsWon = [];
      t.points = 10000;
    });
    users.forEach((u) => {
      if (u.role !== USER_ROLE.MASTER) u.teamId = null;
    });
  }
  auctionState = { ...auctionState, isAuctionRunning: true, isAuctionPaused: true, currentAuctionItemIndex: -1 };
  saveData();
  messageElement.textContent = '경매가 준비되었습니다. "다음 매물"을 클릭하세요.';
  messageElement.classList.add('green');
  updateAuctionControls();
  renderAuctionPage();
}

function handleStopAuction(messageElement) {
  if (auctionState.intervalId) clearInterval(auctionState.intervalId);
  auctionState.isAuctionRunning = false;
  saveData();
  messageElement.textContent = '경매가 중지되었습니다.';
  messageElement.classList.add('orange');
  updateAuctionControls();
  renderAuctionPage();
}

function handleNextAuction() {
  if (!auctionState.isAuctionRunning) return;
  startNextAuction();
}

masterStartAuctionBtn.addEventListener('click', () => handleStartAuction(auctionMasterMessage));
masterStopAuctionBtn.addEventListener('click', () => handleStopAuction(auctionMasterMessage));
masterNextAuctionBtn.addEventListener('click', handleNextAuction);

auctionPageStartAuctionBtn.addEventListener('click', () => handleStartAuction(auctionPageMasterMessage));
auctionPageStopAuctionBtn.addEventListener('click', () => handleStopAuction(auctionPageMasterMessage));
auctionPageNextAuctionBtn.addEventListener('click', handleNextAuction);

function updateAuctionControls() {
  const isEnded = isAuctionEndable();
  const canStart = !auctionState.isAuctionRunning || isEnded;
  const canStop = auctionState.isAuctionRunning;
  const canNext = auctionState.isAuctionRunning && auctionState.isAuctionPaused && !isEnded;

  [masterStartAuctionBtn, auctionPageStartAuctionBtn].forEach((btn) => (btn.disabled = !canStart));
  [masterStopAuctionBtn, auctionPageStopAuctionBtn].forEach((btn) => (btn.disabled = !canStop));
  [masterNextAuctionBtn, auctionPageNextAuctionBtn].forEach((btn) => (btn.disabled = !canNext));
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
    if (!items[currentIndex].isSold) {
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
      timer: 10,
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
    if (winningTeam && winningTeam.itemsWon.length < 5) {
      winningTeam.points -= auctionState.currentBid;
      winningTeam.itemsWon.push(currentItem.id);
      currentItem.isSold = true;
      currentItem.bidderTeamId = winningTeam.id;
      currentItem.bidPrice = auctionState.currentBid;
      if (currentItem.participantId) {
        const user = users.find((u) => u.id === currentItem.participantId);
        if (user) user.teamId = winningTeam.id;
      }
    }
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
  saveData();
  alert('모든 경매가 종료되었습니다.');
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

// --- 마스터 입찰 로직 ---
function masterBid(teamId, incrementAmount) {
  if (!currentUser || currentUser.role !== USER_ROLE.MASTER) return;
  const currentItem = items[auctionState.currentAuctionItemIndex];
  if (!currentItem || auctionState.timer <= 0 || auctionState.isAuctionPaused) return;
  const biddingTeam = teams.find((t) => t.id === teamId);
  if (!biddingTeam || biddingTeam.itemsWon.length >= 5) return;

  const newBid = auctionState.currentBid + incrementAmount;
  if (biddingTeam.points < newBid) {
    alert(`${biddingTeam.name} 팀의 포인트가 부족합니다!`);
    return;
  }
  auctionState.currentBid = newBid;
  auctionState.currentBidderTeamId = biddingTeam.id;
  auctionState.timer = auctionState.timer > 10 ? auctionState.timer : 10;
  auctionState.currentAuctionStartTime = Date.now();
  saveData();
  updateBidInfo();
  renderParticipantGrid();
  //renderAuctionPage();
}

// --- UI 렌더링 ---
function renderAuctionPage() {
  renderTeamList(); // 팀 목록 렌더링
  renderParticipantGrid(); // 매물 렌더링
  const currentItem = auctionState.currentAuctionItemIndex !== -1 ? items[auctionState.currentAuctionItemIndex] : null;
  updateAuctionDisplay(currentItem);
  updateAuctionControls();
}

function updateAuctionDisplay(item) {
  const isMaster = currentUser && currentUser.role === USER_ROLE.MASTER;
  auctionPageMasterControls.style.display = 'flex'; // 마스터 컨트롤은 항상 보이게
  document.getElementById('bidButton').style.display = 'none'; // 일반 입찰 버튼은 항상 숨김

  if (item && auctionState.isAuctionRunning && !auctionState.isAuctionPaused) {
    noItemMessage.style.display = 'none';
    currentItemImage.src = item.image;
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
}

function renderTeamList() {
  teamListContainer.innerHTML = '';
  teams.forEach((team) => {
    const teamLeader = users.find((u) => u.id === team.leaderId);
    const teamItem = document.createElement('div');
    teamItem.classList.add('team-item');
    const teamAvatarSrc = `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(team.name)}`;

    let masterBidButtonsHTML = '';
    if (currentUser && currentUser.role === USER_ROLE.MASTER) {
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
      <div class="team-slots">${Array(5)
        .fill()
        .map((_, i) => `<div class="slot-indicator ${team.itemsWon.length > i ? 'filled' : ''}"></div>`)
        .join('')}</div>
      ${masterBidButtonsHTML}
    `;
    teamListContainer.appendChild(teamItem);
  });
}

function renderParticipantGrid() {
  participantGrid.innerHTML = '';
  const participants = users.filter(
    (u) => u.role === USER_ROLE.TEAM_LEADER || (u.role === USER_ROLE.GENERAL && u.teamId === null)
  );
  participants.forEach((user) => {
    const avatar = document.createElement('div');
    avatar.className = 'participant-avatar';
    const currentItem = items[auctionState.currentAuctionItemIndex];
    if (user.role === USER_ROLE.TEAM_LEADER) {
      avatar.classList.add('border-team-leader');
      if (auctionState.currentBidderTeamId === teams.find((t) => t.leaderId === user.id)?.id)
        avatar.classList.add('active-bidder');
    } else if (currentItem && currentItem.participantId === user.id) {
      avatar.classList.add('border-auction-item');
    } else {
      avatar.classList.add('border-general');
    }
    avatar.title = user.username;
    avatar.style.backgroundImage = `url(https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(
      user.username
    )})`;
    participantGrid.appendChild(avatar);
  });
}

// --- 결과 다운로드 ---
downloadTeamResultsBtn.addEventListener('click', () => {
  let report = `<h1>경매 최종 결과</h1>`;
  teams.forEach((team) => {
    const leader = users.find((u) => u.id === team.leaderId);
    const members = users.filter((u) => u.teamId === team.id && u.role === USER_ROLE.GENERAL);
    report += `
            <div class="team-section">
                <h2>${team.name} (리더: ${leader ? leader.username : '없음'})</h2>
                <p>남은 포인트: ${team.points.toLocaleString()}P</p>
                <h3>팀원</h3>
                <ul>
                    ${leader ? `<li>${leader.username} (팀장)</li>` : ''}
                    ${members.map((m) => `<li>${m.username}</li>`).join('')}
                </ul>
            </div>
        `;
  });
  const reportWindow = window.open();
  reportWindow.document.write(
    `<style>body{font-family:sans-serif}.team-section{margin-bottom:20px;padding:10px;border:1px solid #ccc;}</style>${report}`
  );
  reportWindow.document.close();
  reportWindow.print();
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
