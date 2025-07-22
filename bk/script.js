/* 상수 정리 */
const maxTeamItems = 4; // 팀당 최대 매물 수
const timer = 30;
const bidTimer = 10;

// 사용자 역할 상수
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
  timer: timer,
  intervalId: null, // setInterval ID
  currentBid: 0,
  currentBidderTeamId: null,
  isAuctionRunning: false, // 경매 전체가 시작되었는지 여부
  isAuctionPaused: true, // 현재 매물 경매가 일시정지 상태인지 여부 (예: 다음 매물 대기 중)
  currentAuctionStartTime: 0, // 경매가 시작된 시간 (리로드 시 타이머 동기화용)
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
    status: 'pending', // 변경됨
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

  // 기존 팀장 역할 해제
  const oldTeam = teams.find((t) => t.leaderId === user.id);
  if (oldTeam) oldTeam.leaderId = null;

  const oldLeader = users.find((u) => u.id === team.leaderId);
  if (oldLeader) {
    oldLeader.role = USER_ROLE.GENERAL;
    oldLeader.teamId = null;
  }

  // 팀장 지정 및 역할 변경
  team.leaderId = user.id;
  user.role = USER_ROLE.TEAM_LEADER;
  user.teamId = team.id; // 팀장도 해당 팀에 소속

  // 기존 매물에서 팀장 관련 매물 제거
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
  if (team.itemsWon.length >= maxTeamItems) {
    messageElement.textContent = `${team.name} 팀은 가득 찼습니다.`;
    messageElement.classList.add('red');
    return;
  }
  let item = items.find((i) => i.participantId === user.id);
  if (!item) {
    item = { id: `item_manual_${user.id}`, name: user.username, participantId: user.id, status: 'sold' };
    items.push(item);
  }
  item.status = 'sold';
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
    timer: timer,
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
      status: 'pending', // 변경됨
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

  // 경매 상태 및 데이터 초기화
  auctionState = {
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
    if (u.role !== USER_ROLE.MASTER) u.teamId = null;
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
      timer: timer,
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
      winningTeam.points -= auctionState.currentBid;
      winningTeam.itemsWon.push(currentItem.id);
      currentItem.status = 'sold';
      currentItem.bidderTeamId = winningTeam.id;
      currentItem.bidPrice = auctionState.currentBid;
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
  saveData();
  alert('모든 경매가 종료되었습니다.');
  renderAuctionPage();
  updateAuctionControls();

  // 경매 종료 시 결과 다운로드 버튼/섹션 표시
  auctionResultsSection.style.display = 'block';
  downloadTeamResultsBtn.style.display = 'inline-block';
  downloadJsonDataBtn.style.display = 'inline-block';
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
function showCustomAlert(message) {
  // 이미 있으면 제거
  const oldModal = document.getElementById('customAlertModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'customAlertModal';
  modal.innerHTML = `
    <div style="
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        background: linear-gradient(135deg, #00adb5 0%, #222831 100%);
        color: #fff; border-radius: 18px; box-shadow: 0 8px 32px #0008;
        padding: 48px 36px; text-align: center; max-width: 420px; font-size: 1.35em; font-family: 'Bebas Neue', 'Segoe UI', Arial, sans-serif;
        position: relative;
      ">
        <div style="font-size:2.2em; margin-bottom:18px;">🎉 낙찰! 🎉</div>
        <div style="margin-bottom:24px;">${message}</div>
        <button id="customAlertCloseBtn" style="
          background: #00adb5; color: #fff; border: none; border-radius: 8px;
          padding: 12px 32px; font-size: 1.1em; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px #00adb533;
        ">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('customAlertCloseBtn').onclick = () => modal.remove();
}
// --- 마스터 입찰 로직 ---
function masterBid(teamId, incrementAmount) {
  if (!currentUser || currentUser.role !== USER_ROLE.MASTER) return;
  const currentItem = items[auctionState.currentAuctionItemIndex];
  if (!currentItem || auctionState.timer <= 0 || auctionState.isAuctionPaused) return;
  const biddingTeam = teams.find((t) => t.id === teamId);
  if (!biddingTeam) return;

  const newBid = auctionState.currentBid + incrementAmount;
  if (biddingTeam.points < newBid) {
    alert(`${biddingTeam.name} 팀의 포인트가 부족합니다!`);
    return;
  }
  if (biddingTeam.itemsWon.length >= maxTeamItems) {
    alert(`${biddingTeam.name} 팀은 이미 최대 매물을 보유하고 있습니다!`);
    return;
  }

  auctionState.currentBid = newBid;
  auctionState.currentBidderTeamId = biddingTeam.id;
  auctionState.currentAuctionStartTime = Date.now();

  const otherTeamLeaders = teams
    .filter((t) => t.id !== teamId)
    .map((t) => users.find((u) => u.id === t.leaderId))
    .filter((u) => u && typeof u.points === 'number');
  const allOthersLowerOrEqual = otherTeamLeaders.every((leader) => leader.points <= newBid);

  // 다른 팀장들이 낼 수 없는 가격(같거나 작을 때) 즉시 낙찰
  if (allOthersLowerOrEqual) {
    // 낙찰자 정보 alert 추가
    const winner = users.find((u) => u.teamId === biddingTeam.id && u.role === USER_ROLE.TEAM_LEADER);
    const winnerName = winner ? winner.username : '팀장';
    showCustomAlert(
      `"${currentItem.name}" 매물이<br><b>${winnerName}</b> 님이 속한 <b>${biddingTeam.name}</b> 팀에 낙찰되었습니다!`
    );
    auctionState.timer = 0;
    if (auctionState.intervalId) clearInterval(auctionState.intervalId);
    handleAuctionEndRound();
    return;
  }

  auctionState.timer += auctionState.timer <= 10 ? bidTimer : 0;
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

  // 경매 종료 상태에 따라 결과 버튼/섹션 표시 제어
  if (!auctionState.isAuctionRunning && isAuctionEndable()) {
    auctionResultsSection.style.display = 'block';
    downloadTeamResultsBtn.style.display = 'inline-block';
    downloadJsonDataBtn.style.display = 'inline-block';
  } else {
    auctionResultsSection.style.display = 'none';
    downloadTeamResultsBtn.style.display = 'none';
    downloadJsonDataBtn.style.display = 'none';
  }
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
      <div class="team-slots">${Array(maxTeamItems)
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
  // 팀장(TEAM_LEADER)은 제외하고, 팀에 속하지 않은 일반 참여자만 표시
  const participants = users.filter((u) => u.role === USER_ROLE.GENERAL && u.teamId === null);
  participants.forEach((user) => {
    const avatar = document.createElement('div');
    avatar.className = 'participant-avatar';
    const currentItem = items[auctionState.currentAuctionItemIndex];
    if (currentItem && currentItem.participantId === user.id) {
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

downloadTeamResultsBtn.addEventListener('click', () => {
  let report = `
  <div style="
    background: var(--secondary-bg, #393e46);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 48px 36px 36px 36px;
    font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    color: var(--text-color, #eeeeee);
    position: relative;
    overflow: hidden;
    border: 4px solid var(--accent-color, #00adb5);
    box-sizing: border-box;
  ">
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 36px;
    ">
      <h2 style="
        color: var(--accent-color, #00adb5);
        font-size: 2.2em;
        margin: 0;
        letter-spacing: 1px;
        font-family: 'Bebas Neue', 'Segoe UI', 'Roboto', Arial, sans-serif;
      ">경매 최종 결과</h2>
      <button id="printReportBtn" style="
        background: var(--accent-color, #00adb5);
        color: var(--secondary-bg, #393e46);
        border: none;
        border-radius: 8px;
        padding: 10px 26px;
        font-size: 1.08em;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 8px #00adb533;
        transition: background 0.3s;
        font-family: 'Bebas Neue', 'Segoe UI', 'Roboto', Arial, sans-serif;
      ">인쇄</button>
    </div>
    <table style="
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: var(--primary-bg, #222831);
      border-radius: 12px;
      overflow: hidden;
      font-size: 1.04em;
      box-shadow: 0 2px 8px #0001;
      color: var(--text-color, #eeeeee);
    ">
      <thead>
        <tr style="background: var(--accent-color, #00adb5);">
          <th style="padding:18px 10px; border-bottom:2px solid var(--border-color, #4a4f57); color:#fff; font-size:1.08em;">팀명</th>
          <th style="padding:18px 10px; border-bottom:2px solid var(--border-color, #4a4f57); color:#fff; font-size:1.08em;">남은 포인트</th>
          <th style="padding:18px 10px; border-bottom:2px solid var(--border-color, #4a4f57); color:#fff; font-size:1.08em;">팀원 (포인트 사용 내역)</th>
        </tr>
      </thead>
      <tbody>
  `;
  teams.forEach((team) => {
    const leader = users.find((u) => u.id === team.leaderId);
    const members = users.filter((u) => u.teamId === team.id);
    report += `
      <tr style="background: var(--primary-bg, #222831);">
        <td style="padding:16px 10px; border-bottom:1px solid var(--border-color, #4a4f57);">
          <strong style="font-size:1.12em; color:var(--accent-color, #00adb5);">${team.name}</strong><br>
          <span style="color:var(--light-grey-text, #cccccc); font-size:0.97em;">(리더: ${
            leader ? leader.username : '없음'
          })</span>
        </td>
        <td style="padding:16px 10px; border-bottom:1px solid var(--border-color, #4a4f57); color:var(--success-color, #28a745); font-weight:bold; font-size:1.09em;">
          ${team.points.toLocaleString()}P
        </td>
        <td style="padding:16px 10px; border-bottom:1px solid var(--border-color, #4a4f57);">
          <ul style="margin:0; padding-left:20px; list-style:disc;">
            ${members
              .map((member) => {
                const wonItem = items.find(
                  (item) => item.participantId === member.id && item.status === 'sold' && item.bidderTeamId === team.id
                );
                const price = wonItem && typeof wonItem.bidPrice === 'number' ? wonItem.bidPrice : 0;
                const roleText =
                  member.role === USER_ROLE.TEAM_LEADER
                    ? ' <span style="color:var(--accent-color, #00adb5); font-weight:bold;">(팀장)</span>'
                    : '';
                return `<li style="margin-bottom:5px; font-size:1em; color:var(--text-color, #eeeeee);">
                  <span style="font-weight:500;">${member.username}${roleText}</span>
                  <span style="color:var(--danger-color, #dc3545); font-weight:bold;"> - ${price.toLocaleString()}P</span>
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
    <div style="margin-top:32px; text-align:right; color:var(--light-grey-text, #cccccc); font-size:0.98em;">
      Powered by POTG Auction
    </div>
  </div>
  <link href="https://fonts.googleapis.com/css?family=Bebas+Neue:400,700&display=swap" rel="stylesheet">
  <script>
    document.getElementById('printReportBtn').onclick = function() {
      window.print();
    };
    window.onbeforeprint = function() {
      document.body.style.background = "#fff";
      document.body.style.color = "#222";
      var btn = document.getElementById('printReportBtn');
      if(btn) btn.style.display = "none";
    };
    window.onafterprint = function() {
      var btn = document.getElementById('printReportBtn');
      if(btn) btn.style.display = "";
    };
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
