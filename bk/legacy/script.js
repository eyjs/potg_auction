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

// 현재 로그인한 사용자 정보 (sessionId 대신 localStorage에 저장)
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
const auctionUsernameDisplay = document.getElementById('auctionUsernameDisplay'); // Auction page user display
const logoutBtnMaster = document.getElementById('logoutBtnMaster');
const logoutBtnAuction = document.getElementById('logoutBtnAuction');

// Scaffold Button
const scaffoldBtn = document.getElementById('scaffoldBtn');
const scaffoldMessage = document.getElementById('scaffoldMessage');

// Go To Auction Page Button (Master Page)
const goToAuctionPageBtn = document.getElementById('goToAuctionPageBtn');
// Go To Master Page Button (Auction Page)
const goToMasterPageBtn = document.getElementById('goToMasterPageBtn');

// Master Page elements
const regUsernameInput = document.getElementById('regUsername');
const regPasswordInput = document.getElementById('regPassword');
const registerUserBtn = document.getElementById('registerUserBtn');
const regUserMessage = document.getElementById('regUserMessage');

const teamNameInput = document.getElementById('teamNameInput');
const createTeamBtn = document.getElementById('createTeamBtn');
const createTeamMessage = document.getElementById('createTeamMessage');
const createdTeamsList = document.getElementById('createdTeamsList');

// Drag & Drop specific elements (Team Leader Assignment)
const availableUsersList = document.getElementById('availableUsersList');
const dndTeamsList = document.getElementById('dndTeamsList');
const dndAssignMessage = document.getElementById('dndAssignMessage');
const currentTeamLeadersList = document.getElementById('currentTeamLeadersList'); // Re-use for listing current leaders

// Master Page elements (Item Registration)
const itemNameInput = document.getElementById('itemNameInput');
const itemDescInput = document.getElementById('itemDescInput');
const itemImageInput = document.getElementById('itemImageInput');
const addItemBtn = document.getElementById('addItemBtn');
const addItemMessage = document.getElementById('addItemMessage');
const registeredItemsList = document.getElementById('registeredItemsList');

// Master Auction Controls (STILL ON MASTER PAGE)
const auctionMasterControls = document.getElementById('auctionMasterControls');
const masterStartAuctionBtn = document.getElementById('masterStartAuctionBtn');
const masterStopAuctionBtn = document.getElementById('masterStopAuctionBtn');
const masterNextAuctionBtn = document.getElementById('masterNextAuctionBtn');
const auctionMasterMessage = document.getElementById('auctionMasterMessage');

// Auction Page elements
const teamListContainer = document.getElementById('teamListContainer');
const noItemMessage = document.getElementById('noItemMessage');
const currentItemName = document.getElementById('currentItemName');
const currentItemDescription = document.getElementById('currentItemDescription');
const currentItemImage = document.getElementById('currentItemImage');
const currentBidInfo = document.getElementById('currentBidInfo');
const currentBidValue = document.getElementById('currentBidValue');
const currentBidTeam = document.getElementById('currentBidTeam');
const timeCountDisplay = document.getElementById('timeCount');

// --- NEW: Auction Page Master Controls ---
const auctionPageMasterControls = document.getElementById('auctionPageMasterControls');
const auctionPageStartAuctionBtn = document.getElementById('auctionPageStartAuctionBtn');
const auctionPageNextAuctionBtn = document.getElementById('auctionPageNextAuctionBtn');
const auctionPageStopAuctionBtn = document.getElementById('auctionPageStopAuctionBtn');
const auctionPageMasterMessage = document.getElementById('auctionPageMasterMessage'); // Added for messages on auction page for master

// --- EXISTING: Bid button (now only for team leaders) ---
const bidButton = document.getElementById('bidButton');

const participantGrid = document.getElementById('participantGrid');

// Unbid Item Assignment Section (MOVED BACK TO MASTER PAGE)
const unbidItemAssignmentSection = document.getElementById('unbidItemAssignmentSection');
const unbidItemsListMasterPage = document.getElementById('unbidItemsListMasterPage'); // Renamed for clarity
const unbidItemsTeamsListMasterPage = document.getElementById('unbidItemsTeamsListMasterPage'); // Renamed for clarity
const unbidItemAssignMessageMasterPage = document.getElementById('unbidItemAssignMessageMasterPage'); // Renamed for clarity

// NEW: Auction Results Section
const auctionResultsSection = document.getElementById('auctionResultsSection');
const downloadTeamResultsBtn = document.getElementById('downloadTeamResultsBtn');
const downloadJsonDataBtn = document.getElementById('downloadJsonDataBtn');

// --- 초기 데이터 설정 (테스트용) ---
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
  console.log('Data saved:', { users, teams, items, auctionState });
}

function loadData() {
  users = JSON.parse(localStorage.getItem('users')) || [];
  teams = JSON.parse(localStorage.getItem('teams')) || [];
  items = JSON.parse(localStorage.getItem('items')) || [];
  const storedAuctionState = JSON.parse(localStorage.getItem('auctionState'));
  if (storedAuctionState) {
    // Restore non-function properties
    Object.assign(auctionState, storedAuctionState);

    // Restore timer if it was running and time is left
    if (auctionState.isAuctionRunning && !auctionState.isAuctionPaused && auctionState.currentAuctionItemIndex !== -1) {
      const timeElapsed = Math.floor((Date.now() - auctionState.currentAuctionStartTime) / 1000);
      auctionState.timer = Math.max(0, auctionState.timer - timeElapsed);

      if (auctionState.timer > 0) {
        startTimer(); // Restart timer
      } else {
        handleAuctionEndRound(); // Timer ran out while page was closed, handle end of round
      }
    }
  }
}

// --- 페이지 전환 함수 ---
function showPage(pageId) {
  document.querySelectorAll('.page-container').forEach((page) => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');

  // Update specific page elements after showing
  if (pageId === 'auctionPage') {
    auctionUsernameDisplay.textContent = currentUser ? currentUser.username : '게스트';
    // Hide master controls from auction page view, show relevant buttons
    goToMasterPageBtn.style.display = currentUser && currentUser.role === USER_ROLE.MASTER ? 'inline-block' : 'none';

    renderAuctionPage(); // Render auction page elements
  } else if (pageId === 'masterPage') {
    masterUsernameDisplay.textContent = currentUser ? currentUser.username : '게스트';
    renderMasterPage(); // Render master page elements
  }
  // Hide results section when changing pages unless specifically needed on auction end
  auctionResultsSection.style.display = 'none';
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

    if (user.role === USER_ROLE.MASTER) {
      showPage('masterPage');
    } else {
      // For TEAM_LEADER and GENERAL roles, show auctionPage
      showPage('auctionPage');
    }
  } else {
    loginMessage.textContent = '잘못된 사용자 이름 또는 비밀번호입니다.';
    loginMessage.classList.remove('green');
    loginMessage.classList.add('red');
  }
});

function logout() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  // Clear auction timer if running
  if (auctionState.intervalId) {
    clearInterval(auctionState.intervalId);
    auctionState.intervalId = null;
  }
  saveData(); // Save current state
  showPage('loginPage');
  loginMessage.textContent = '로그아웃 되었습니다.';
  loginMessage.classList.remove('red');
  loginMessage.classList.add('green');
  // Hide auction results section on logout
  auctionResultsSection.style.display = 'none';
  // Hide unbid assignment section on logout
  unbidItemAssignmentSection.style.display = 'none';
}

logoutBtnMaster.addEventListener('click', logout);
logoutBtnAuction.addEventListener('click', logout);

// 마스터 페이지에서 경매 페이지로 이동 버튼 이벤트 리스너
goToAuctionPageBtn.addEventListener('click', () => {
  if (currentUser && currentUser.role === USER_ROLE.MASTER) {
    showPage('auctionPage');
  } else {
    alert('마스터만 경매 페이지로 이동할 수 있습니다.');
  }
});

// 경매 페이지에서 마스터 페이지로 이동 버튼 이벤트 리스너
goToMasterPageBtn.addEventListener('click', () => {
  if (currentUser && currentUser.role === USER_ROLE.MASTER) {
    showPage('masterPage');
  } else {
    alert('마스터만 관리자 패널로 이동할 수 있습니다.');
  }
});

// --- 마스터 페이지 기능 ---
function renderMasterPage() {
  if (currentUser && currentUser.role === USER_ROLE.MASTER) {
    masterUsernameDisplay.textContent = currentUser.username;
    updateMasterPageLists(); // Consolidate list updates
    scaffoldMessage.textContent = ''; // Clear previous scaffold message
    updateAuctionControls(); // Update master controls status for master page

    // NEW: Check if auction is fully ended by participant assignment
    if (isAuctionFullyEnded() && !auctionState.isAuctionRunning) {
      // Function name changed
      unbidItemAssignmentSection.style.display = 'flex';
      populateUnbidItemsList(unbidItemsListMasterPage); // Populate for master page
      populateUnbidItemsTeamsList(unbidItemsTeamsListMasterPage); // Populate for master page
      unbidItemAssignMessageMasterPage.textContent = '';
    } else {
      unbidItemAssignmentSection.style.display = 'none';
    }
  }
}

function updateMasterPageLists() {
  populateAvailableUsersList(); // 사용 가능한 사용자 (팀장 D&D 소스)
  populateDndTeamsList(); // D&D 팀 목록 (팀장 D&D 타겟)
  updateTeamListMasterPage(); // 마스터 페이지의 '생성된 팀 목록'과 '현재 팀장 목록' 업데이트
  updateRegisteredItemsList(); // 등록된 매물 목록 업데이트

  // 유찰 매물 배정 섹션 관련 목록 업데이트
  populateUnbidItemsList(unbidItemsListMasterPage);
  populateUnbidItemsTeamsList(unbidItemsTeamsListMasterPage);
}

// 사용자 등록
registerUserBtn.addEventListener('click', () => {
  const username = regUsernameInput.value.trim();
  const password = regPasswordInput.value.trim();
  if (!username || !password) {
    regUserMessage.textContent = '사용자 이름과 비밀번호를 입력하세요.';
    regUserMessage.classList.remove('green');
    regUserMessage.classList.add('red');
    return;
  }
  if (users.some((u) => u.username === username)) {
    regUserMessage.textContent = '이미 존재하는 사용자 이름입니다.';
    regUserMessage.classList.remove('green');
    regUserMessage.classList.add('red');
    return;
  }
  const newUser = { id: `user_${Date.now()}`, username, password, role: USER_ROLE.GENERAL, teamId: null, points: 0 };
  users.push(newUser);
  saveData();
  regUserMessage.textContent = `사용자 '${username}'이(가) 등록되었습니다.`;
  regUserMessage.classList.remove('red');
  regUserMessage.classList.add('green');
  regUsernameInput.value = '';
  regPasswordInput.value = '';
  updateMasterPageLists(); // Update all related lists
});

// 팀 생성
createTeamBtn.addEventListener('click', () => {
  const teamName = teamNameInput.value.trim();
  if (!teamName) {
    createTeamMessage.textContent = '팀 이름을 입력하세요.';
    createTeamMessage.classList.remove('green');
    createTeamMessage.classList.add('red');
    return;
  }
  if (teams.some((t) => t.name === teamName)) {
    createTeamMessage.textContent = '이미 존재하는 팀 이름입니다.';
    createTeamMessage.classList.remove('green');
    createTeamMessage.classList.add('red');
    return;
  }
  const newTeam = { id: `team_${Date.now()}`, name: teamName, leaderId: null, points: 0, itemsWon: [] };
  teams.push(newTeam);
  saveData();
  createTeamMessage.textContent = `팀 '${teamName}'이(가) 생성되었습니다.`;
  createTeamMessage.classList.remove('red');
  createTeamMessage.classList.add('green');
  teamNameInput.value = '';
  updateMasterPageLists(); // Update all related lists
});

// 마스터 페이지 UI 업데이트 함수
function updateTeamListMasterPage() {
  createdTeamsList.innerHTML = '';
  teams.forEach((team) => {
    const li = document.createElement('li');
    const leader = users.find((u) => u.id === team.leaderId);
    li.innerHTML = `
            <span>${team.name} (팀장: ${leader ? leader.username : '없음'})</span>
        `;
    createdTeamsList.appendChild(li);
  });

  currentTeamLeadersList.innerHTML = '';
  teams
    .filter((t) => t.leaderId)
    .forEach((team) => {
      const leader = users.find((u) => u.id === team.leaderId);
      if (leader) {
        const li = document.createElement('li');
        li.innerHTML = `
                <span>${team.name} - ${leader.username} (${leader.points.toLocaleString()}P)</span>
                <button class="delete" onclick="removeTeamLeader('${team.id}')">해제</button>
            `;
        currentTeamLeadersList.appendChild(li);
      }
    });
}

function removeTeamLeader(teamId) {
  const team = teams.find((t) => t.id === teamId);
  if (team && team.leaderId) {
    const leader = users.find((u) => u.id === team.leaderId);
    if (leader) {
      leader.role = USER_ROLE.GENERAL;
      leader.teamId = null;
      leader.points = 0; // Reset points on removal
    }
    team.leaderId = null;
    team.points = 0;
    team.itemsWon = []; // Reset won items on removal as well (clean slate for team)
    saveData();
    updateMasterPageLists(); // Re-render all related lists
    dndAssignMessage.textContent = `'${leader ? leader.username : ''}' (이)가 '${team.name}' 팀장에서 해제되었습니다.`;
    dndAssignMessage.classList.remove('red', 'orange');
    dndAssignMessage.classList.add('green');
  }
}

// 매물 추가
addItemBtn.addEventListener('click', () => {
  const itemName = itemNameInput.value.trim();
  const itemDesc = itemDescInput.value.trim();
  const itemImage = itemImageInput.value.trim();

  if (!itemName) {
    addItemMessage.textContent = '매물 이름을 입력하세요.';
    addItemMessage.classList.remove('green');
    addItemMessage.classList.add('red');
    return;
  }

  // NEW: 일반 매물과 참여자 매물의 중복 검사 분리 (participantId가 없는 경우만 이름 중복 검사)
  if (items.some((i) => i.name === itemName && !i.participantId)) {
    // Modified condition: if a non-participant item with this name already exists
    addItemMessage.textContent = '이미 존재하는 매물 이름입니다.';
    addItemMessage.classList.remove('green');
    addItemMessage.classList.add('red');
    return;
  }

  const newItem = {
    id: `item_${Date.now()}`,
    name: itemName,
    description: itemDesc,
    image: itemImage || `https://api.dicebear.com/8.x/bottts/svg?seed=${itemName}`,
    bidPrice: 0,
    bidderTeamId: null,
    isSold: false,
    participantId: null, // This is a general item, not tied to a participant user
  };
  items.push(newItem);
  saveData();
  addItemMessage.textContent = `매물 '${itemName}'이(가) 등록되었습니다.`;
  addItemMessage.classList.remove('red');
  addItemMessage.classList.add('green');
  itemNameInput.value = '';
  itemDescInput.value = '';
  itemImageInput.value = '';
  updateMasterPageLists(); // Update all related lists
});

function updateRegisteredItemsList() {
  registeredItemsList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    // If it's a participant item, display username, otherwise item name
    const displayName = item.participantId
      ? users.find((u) => u.id === item.participantId)?.username || '알 수 없는 참여자'
      : item.name;

    let statusText = '';
    if (item.isSold) {
      const winningTeam = teams.find((t) => t.id === item.bidderTeamId);
      statusText = `(판매 완료 - ${winningTeam ? winningTeam.name : '팀 없음'})`;
    } else if (item.bidPrice === 0 && item.bidderTeamId === null && !item.isSold) {
      statusText = '(유찰/경매 전)';
    } else if (!item.isSold && item.bidPrice > 0) {
      // Item is not sold but has a bid, implies active auction for this item
      statusText = '(경매 진행 중)';
    } else {
      statusText = '(상태 불명)'; // Fallback for any unhandled state
    }

    li.innerHTML = `
            <span>${displayName} ${statusText}</span>
            <button class="delete" onclick="deleteItem('${item.id}')">삭제</button>
        `;
    registeredItemsList.appendChild(li);
  });
}

function deleteItem(itemId) {
  const currentItemInAuction = items.find((item) => items.indexOf(item) === auctionState.currentAuctionItemIndex);
  if (currentItemInAuction && currentItemInAuction.id === itemId) {
    addItemMessage.textContent = '현재 경매 중인 매물은 삭제할 수 없습니다.';
    addItemMessage.classList.remove('green');
    addItemMessage.classList.add('red');
    return;
  }

  // Check if the item is linked to a participant and if that participant is a team leader
  const itemToDelete = items.find((item) => item.id === itemId);
  if (itemToDelete && itemToDelete.participantId) {
    const associatedUser = users.find((u) => u.id === itemToDelete.participantId);
    // NEW: If a participant user is linked to an item and that user is a team leader, prevent deletion.
    // Also prevent deletion if user is a GENERAL role but is assigned to a team (via D&D)
    if (associatedUser && (associatedUser.role === USER_ROLE.TEAM_LEADER || associatedUser.teamId !== null)) {
      addItemMessage.textContent = '팀에 배정된 참여자 매물은 삭제할 수 없습니다. 먼저 팀장/팀 배정을 해제하세요.';
      addItemMessage.classList.remove('green');
      addItemMessage.classList.add('red');
      return;
    }
  }

  items = items.filter((item) => item.id !== itemId);
  // Also clean up any team's won items if this item was won
  teams.forEach((team) => {
    team.itemsWon = team.itemsWon.filter((wonItemId) => wonItemId !== itemId);
  });

  // If a GENERAL user was represented by this item, reset their teamId
  if (itemToDelete && itemToDelete.participantId) {
    const userRepresentedByItem = users.find((u) => u.id === itemToDelete.participantId);
    if (userRepresentedByItem && userRepresentedByItem.role === USER_ROLE.GENERAL) {
      userRepresentedByItem.teamId = null; // Unassign the user
    }
  }

  saveData();
  updateMasterPageLists(); // Update all related lists
  addItemMessage.textContent = '매물이 삭제되었습니다.';
  addItemMessage.classList.remove('red');
  addItemMessage.classList.add('green');
}

// --- Drag & Drop 기능 (팀장 설정) ---
function populateAvailableUsersList() {
  availableUsersList.innerHTML = '';
  // Only show GENERAL users who are not already team leaders and are not tied to an active/unbid item
  // NEW: user.teamId === null 조건을 추가하여 이미 팀에 배정된 일반 사용자도 드래그앤드롭 목록에서 제외
  users
    .filter(
      (u) => u.role === USER_ROLE.GENERAL && u.teamId === null // Only show users not yet assigned to any team (including those not yet put on auction)
    )
    .forEach((user) => {
      const li = document.createElement('li');
      li.classList.add('draggable-user');
      li.setAttribute('draggable', 'true');
      li.dataset.userId = user.id;
      li.textContent = user.username;
      li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.userId);
        e.dataTransfer.effectAllowed = 'move';
      });
      availableUsersList.appendChild(li);
    });
}

function populateDndTeamsList() {
  dndTeamsList.innerHTML = '';
  teams.forEach((team) => {
    const li = document.createElement('li');
    li.classList.add('dnd-team-item');
    li.dataset.teamId = team.id;
    const leader = users.find((u) => u.id === team.leaderId);
    li.innerHTML = `
            <span><strong>${team.name}</strong></span>
            <span>팀장: ${leader ? leader.username : '없음'}</span>
        `;

    li.addEventListener('dragover', (e) => {
      e.preventDefault(); // Allow drop
      e.dataTransfer.dropEffect = 'move';
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      const userId = e.dataTransfer.getData('text/plain');
      const targetTeamItem = e.target.closest('.dnd-team-item'); // Find the closest team item
      if (targetTeamItem) {
        const targetTeamId = targetTeamItem.dataset.teamId;
        assignTeamLeaderDnd(userId, targetTeamId);
      }
    });
    dndTeamsList.appendChild(li);
  });
}

function assignTeamLeaderDnd(userId, teamId) {
  const user = users.find((u) => u.id === userId);
  const team = teams.find((t) => t.id === teamId);

  if (!user || !team) {
    dndAssignMessage.textContent = '유효하지 않은 사용자 또는 팀입니다.';
    dndAssignMessage.classList.remove('green');
    dndAssignMessage.classList.add('red');
    return;
  }

  if (user.role === USER_ROLE.MASTER) {
    dndAssignMessage.textContent = '마스터는 팀장이 될 수 없습니다.';
    dndAssignMessage.classList.remove('green');
    dndAssignMessage.classList.add('red');
    return;
  }

  // If the user is currently an auction item (participant to be auctioned)
  // and is not yet sold, remove this item.
  const itemRepresentingUser = items.find((item) => item.participantId === user.id);
  if (itemRepresentingUser && !itemRepresentingUser.isSold) {
    // If this item was the current auction item, stop the auction for it
    if (
      auctionState.currentAuctionItemIndex !== -1 &&
      items[auctionState.currentAuctionItemIndex].id === itemRepresentingUser.id
    ) {
      handleStopAuction(auctionMasterMessage); // Stop auction and clear timer
      auctionState.currentAuctionItemIndex = -1; // Reset current item index
      auctionState.currentBid = 0; // Clear bid for old item
      auctionState.currentBidderTeamId = null;
    }
    // Remove the item linked to this user, as they are now a team leader, not an auction item
    items = items.filter((item) => !(item.participantId === user.id));
  }

  // If user is already a leader of another team, make that old team's leader null
  const oldTeamOfUser = teams.find((t) => t.leaderId === user.id);
  if (oldTeamOfUser && oldTeamOfUser.id !== team.id) {
    oldTeamOfUser.leaderId = null;
    oldTeamOfUser.points = 0;
    oldTeamOfUser.itemsWon = [];
  }

  // If team already has a leader, make that old leader a general user
  const oldLeaderOfTeam = users.find((u) => u.id === team.leaderId); // Find by team.leaderId, not user.teamId
  if (oldLeaderOfTeam && oldLeaderOfTeam.id !== user.id) {
    oldLeaderOfTeam.role = USER_ROLE.GENERAL;
    oldLeaderOfTeam.teamId = null; // Crucial: unset teamId
    oldLeaderOfTeam.points = 0;
  }

  // Assign new leader
  team.leaderId = user.id;
  user.role = USER_ROLE.TEAM_LEADER;
  user.teamId = team.id;
  user.points = 10000; // 초기 10000 포인트 지급
  team.points = 10000; // 팀에도 포인트 할당 (팀장과 동기화)
  team.itemsWon = []; // New leader means fresh start for team items won

  saveData();
  dndAssignMessage.textContent = `'${user.username}' (이)가 '${team.name}' 팀의 팀장으로 설정되었습니다. 10000 포인트 지급 완료.`;
  dndAssignMessage.classList.remove('red', 'orange');
  dndAssignMessage.classList.add('green');

  updateMasterPageLists(); // Re-render all related lists
  renderParticipantGrid(); // Update participant grid on master and auction page
  renderTeamList(); // Update team list on auction page (especially points)
  updateAuctionControls(); // Check if auction is now fully ended
}

// --- 유찰 매물 배정 (드래그 앤 드롭) - Master Page에 위치 ---
function populateUnbidItemsList(listElement) {
  listElement.innerHTML = '';
  // Get GENERAL users who are currently NOT assigned to any team.
  // This includes users who were part of items that went unbid/unassigned,
  // and users who were never put into auction (e.g., newly registered GENERAL users).
  const unassignedGeneralUsers = users.filter((u) => u.role === USER_ROLE.GENERAL && u.teamId === null);

  unassignedGeneralUsers.forEach((user) => {
    const li = document.createElement('li');
    li.classList.add('draggable-item'); // Use a different class for items
    li.setAttribute('draggable', 'true');
    li.dataset.userId = user.id; // Use userId directly for dragging unassigned users
    const displayName = user.username;
    const userIconSrc = `https://api.dicebear.com/8.x/bottts/svg?seed=${displayName}`; // Use user avatar

    // Determine status based on if an item representing this user exists and is sold
    const itemForThisUser = items.find((i) => i.participantId === user.id);
    const statusText = itemForThisUser && itemForThisUser.isSold ? '(배치 완료)' : '(미배치)';

    li.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div class="participant-avatar" style="width: 30px; height: 30px; font-size: 0.7em; margin-right: 10px; border: none; box-shadow: none; background-image: url(${userIconSrc}); background-size: cover; text-indent: -9999px;">${displayName
      .charAt(0)
      .toUpperCase()}</div>
                <span>${displayName} ${statusText}</span>
            </div>
        `;

    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', e.target.dataset.userId);
      e.dataTransfer.effectAllowed = 'move';
    });
    listElement.appendChild(li);
  });
}

function populateUnbidItemsTeamsList(listElement) {
  listElement.innerHTML = '';
  teams.forEach((team) => {
    const li = document.createElement('li');
    li.classList.add('dnd-team-item'); // Reuse existing team item style for consistency
    li.dataset.teamId = team.id;
    const leader = users.find((u) => u.id === team.leaderId);
    const teamAvatarSrc = `https://api.dicebear.com/8.x/bottts/svg?seed=${team.name}`;
    li.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%;">
                <div class="team-avatar" style="width: 40px; height: 40px; font-size: 0.9em; margin-right: 10px; border: none; box-shadow: none; background-image: url(${teamAvatarSrc}); background-size: cover; text-indent: -9999px;">${team.name
      .charAt(0)
      .toUpperCase()}</div>
                <div class="team-info" style="flex-grow: 1;">
                    <div class="team-name" style="font-size: 1.1em; margin-bottom: 2px;"><strong>${
                      team.name
                    }</strong></div>
                    <div class="team-points" style="font-size: 0.9em; color: var(--light-grey-text);">팀장: ${
                      leader ? leader.username : '없음'
                    }</div>
                </div>
            </div>
            <div class="team-slots" style="margin-top: 10px; justify-content: flex-start;">
                ${Array(5)
                  .fill()
                  .map(
                    (_, i) =>
                      `<div class="slot-indicator ${
                        team.itemsWon.length > i ? 'filled' : ''
                      }" style="width: 15px; height: 15px; margin-left: 3px;"></div>`
                  )
                  .join('')}
            </div>
        `;

    li.addEventListener('dragover', (e) => {
      e.preventDefault(); // Allow drop
      e.dataTransfer.dropEffect = 'move';
      li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      const userId = e.dataTransfer.getData('text/plain'); // Now we're dragging userId
      const targetTeamItem = e.target.closest('.dnd-team-item'); // Find the closest team item
      if (targetTeamItem) {
        const targetTeamId = targetTeamItem.dataset.teamId;
        assignUnbidUserToTeam(userId, targetTeamId, unbidItemAssignMessageMasterPage); // Changed to assignUser
      }
    });
    listElement.appendChild(li);
  });
}

// NEW: Function to assign unbid GENERAL user to a team (direct assignment, not via auction item)
function assignUnbidUserToTeam(userId, teamId, messageElement) {
  const user = users.find((u) => u.id === userId && u.role === USER_ROLE.GENERAL && u.teamId === null);
  const team = teams.find((t) => t.id === teamId);

  if (!user || !team) {
    messageElement.textContent = '유효하지 않은 사용자 또는 팀입니다.';
    messageElement.classList.remove('green');
    messageElement.classList.add('red');
    return;
  }

  if (team.itemsWon.length >= 5) {
    messageElement.textContent = `${team.name}은(는) 이미 5개 매물을 낙찰받아 추가 배정할 수 없습니다.`;
    messageElement.classList.remove('green');
    messageElement.classList.add('red');
    return;
  }

  // Check if this user is represented by an item. If so, update that item.
  // If not, create a new item for this user if they are being assigned.
  let itemRepresentingUser = items.find((item) => item.participantId === user.id);
  if (!itemRepresentingUser) {
    // If no item exists for this user (e.g., they were never put into auction as an item), create one
    itemRepresentingUser = {
      id: `item_manual_${user.id}`, // Unique ID for manually assigned items
      name: user.username,
      description: `참여자 매물: ${user.username} (수동 배정)`,
      image: `https://api.dicebear.com/8.x/bottts/svg?seed=${user.username}`,
      bidPrice: 0, // No bid price for manual assignment
      bidderTeamId: null,
      isSold: false,
      participantId: user.id,
    };
    items.push(itemRepresentingUser); // Add new item if not found
  }

  itemRepresentingUser.isSold = true;
  itemRepresentingUser.bidderTeamId = team.id;
  itemRepresentingUser.bidPrice = 0; // Explicitly 0 for D&D assignment
  team.itemsWon.push(itemRepresentingUser.id);

  user.teamId = team.id; // Assign participant user to the team

  saveData();
  messageElement.textContent = `'${user.username}' 참여자 매물이 '${team.name}' 팀에 배정되었습니다.`;
  messageElement.classList.remove('red', 'orange');
  messageElement.classList.add('green');

  // Re-populate D&D lists on master page
  populateUnbidItemsList(unbidItemsListMasterPage);
  populateUnbidItemsTeamsList(unbidItemsTeamsListMasterPage);
  renderTeamList(); // Update auction page team list for slots
  renderParticipantGrid(); // Update participant highlights on auction page
  updateAuctionControls(); // Check if auction is now fully ended
}

// --- 스캐폴드 기능 ---
scaffoldBtn.addEventListener('click', () => {
  // Confirm with user before clearing data
  if (!confirm('기존 모든 데이터 (사용자, 팀, 매물)를 초기화하고 스캐폴드 데이터를 생성하시겠습니까?')) {
    return;
  }

  // Clear all data except master user
  users = users.filter((u) => u.id === 'master');
  teams = [];
  items = [];
  // Auction state must be fully reset when scaffolding
  auctionState = {
    currentAuctionItemIndex: -1,
    timer: 0,
    intervalId: null, // Clear any running interval
    currentBid: 0,
    currentBidderTeamId: null,
    isAuctionRunning: false,
    isAuctionPaused: true, // Start in a paused state
    currentAuctionStartTime: 0, // Reset start time
  };
  if (auctionState.intervalId) {
    // Ensure interval is cleared immediately
    clearInterval(auctionState.intervalId);
    auctionState.intervalId = null;
  }

  // Generate 20 random general users
  for (let i = 1; i <= 20; i++) {
    const username = `random_user_${i}`;
    users.push({
      id: `user_${Date.now()}_${i}`,
      username: username,
      password: username, // Password same as username for easy testing
      role: USER_ROLE.GENERAL,
      teamId: null,
      points: 0, // Will get points if assigned as leader
    });
  }

  // Generate 3 teams
  const teamNames = ['Random Team A', 'Random Team B', 'Random Team C'];
  teamNames.forEach((name, index) => {
    teams.push({
      id: `team_${Date.now()}_${index}`,
      name: name,
      leaderId: null,
      points: 0,
      itemsWon: [],
    });
  });

  // Randomly assign 3 users as team leaders
  const generalUsers = users.filter((u) => u.role === USER_ROLE.GENERAL);
  const shuffledUsers = [...generalUsers].sort(() => 0.5 - Math.random()); // Shuffle users

  for (let i = 0; i < teams.length; i++) {
    if (shuffledUsers.length > 0) {
      const leaderCandidate = shuffledUsers.shift(); // Take one user from shuffled list using shift()
      const targetTeam = teams[i];

      // Assign as leader
      targetTeam.leaderId = leaderCandidate.id;
      leaderCandidate.role = USER_ROLE.TEAM_LEADER;
      leaderCandidate.teamId = targetTeam.id;
      leaderCandidate.points = 10000; // Initial points for leader
      targetTeam.points = 10000; // Sync team points
    }
  }

  // Register remaining general users as items for auction
  // Only users who are GENERAL role AND are NOT team leaders and NOT already assigned to a team.
  users
    .filter((u) => u.role === USER_ROLE.GENERAL && u.teamId === null)
    .forEach((user) => {
      items.push({
        id: `item_auction_${user.id}`, // Link item ID to user ID for auction
        name: user.username,
        description: `참여자 경매 매물: ${user.username}`,
        image: `https://api.dicebear.com/8.x/bottts/svg?seed=${user.username}`, // Random avatar
        bidPrice: 0,
        bidderTeamId: null,
        isSold: false, // Ensure items are not sold initially
        participantId: user.id, // Store the user ID this item represents
      });
    });

  saveData();
  updateMasterPageLists(); // Update UI
  scaffoldMessage.textContent = '스캐폴드 데이터가 성공적으로 생성되었습니다!';
  scaffoldMessage.classList.remove('red', 'orange');
  scaffoldMessage.classList.add('green');
  updateAuctionControls(); // Update auction page controls after scaffold
  renderAuctionPage(); // Update auction page UI after scaffold (e.g., initial message)
});

// --- 변경된 경매 종료 조건 함수 ---
// 모든 팀이 5개 매물을 낙찰받았는지 확인하는 함수
function isAuctionFullyEnded() {
  // 모든 팀이 5개 이상의 매물을 낙찰받았으면 true 반환
  return teams.every((team) => team.itemsWon.length >= 5);
}

// --- 경매 시작/중지/다음 버튼 (마스터 전용 - Master Page 및 Auction Page에 모두 적용) ---

// Reusable function for auction start logic
function handleStartAuction(messageElement) {
  const allTeamsFull = isAuctionFullyEnded(); // Function name changed
  const generalUsersCount = users.filter((u) => u.role === USER_ROLE.GENERAL).length;
  const teamLeadersCount = teams.filter((t) => t.leaderId).length;

  if (generalUsersCount === 0 && items.filter((item) => item.participantId).length === 0) {
    // Check if there are any participant items to auction
    messageElement.textContent =
      '경매할 참여자 (일반 사용자) 또는 매물이 없습니다. 마스터 페이지에서 사용자를 등록해주세요.';
    messageElement.classList.remove('green', 'orange');
    messageElement.classList.add('red');
    return;
  }
  if (teamLeadersCount === 0) {
    messageElement.textContent = '경매에 참여할 팀장이 설정되지 않았습니다. 마스터 페이지에서 팀장을 설정해주세요.';
    messageElement.classList.remove('green', 'orange');
    messageElement.classList.add('red');
    return;
  }

  if (auctionState.isAuctionRunning && !auctionState.isAuctionPaused) {
    messageElement.textContent = '경매가 이미 진행 중입니다. 중지하거나 다음 매물을 진행하세요.';
    messageElement.classList.remove('green', 'red');
    messageElement.classList.add('orange');
    return;
  }

  // If all teams are full AND the auction is not running, offer to reset.
  if (allTeamsFull && !auctionState.isAuctionRunning) {
    // Condition changed
    if (
      !confirm(
        '모든 팀이 매물 배정을 완료하여 경매가 종료되었습니다. 경매 관련 상태를 초기화하고 다시 시작하시겠습니까? (팀 포인트, 낙찰 매물, 참여자 배정 상태만 초기화됩니다. 등록된 사용자/팀/매물은 유지됩니다.)'
      )
    ) {
      return;
    }
    // Reset relevant data for a new auction round
    items.forEach((item) => {
      item.bidPrice = 0;
      item.bidderTeamId = null;
      item.isSold = false;
    });
    teams.forEach((team) => {
      const leader = users.find((u) => u.id === team.leaderId);
      if (leader) {
        team.points = 10000;
        leader.points = 10000;
      }
      team.itemsWon = [];
    });
    // Reset teamId for GENERAL users to make them available again for auction
    users
      .filter((u) => u.role === USER_ROLE.GENERAL)
      .forEach((user) => {
        user.teamId = null;
      });
    auctionState.currentAuctionItemIndex = -1;
  } else if (auctionState.isAuctionRunning && auctionState.isAuctionPaused) {
    // Resume from paused state. No data reset needed.
  } else {
    auctionState.currentAuctionItemIndex = -1;
  }

  auctionState.isAuctionRunning = true;
  auctionState.isAuctionPaused = true;
  auctionState.currentBid = 0;
  auctionState.currentBidderTeamId = null;
  auctionState.timer = 0;

  if (auctionState.intervalId) {
    clearInterval(auctionState.intervalId);
    auctionState.intervalId = null;
  }
  saveData();
  messageElement.textContent = '경매가 시작 대기 중입니다. "다음 매물" 버튼을 클릭하여 첫 매물을 시작하세요.';
  messageElement.classList.remove('red', 'orange');
  messageElement.classList.add('green');
  updateAuctionControls();
  renderAuctionPage();
}

// Reusable function for auction stop logic
function handleStopAuction(messageElement) {
  if (auctionState.intervalId) {
    clearInterval(auctionState.intervalId);
    auctionState.intervalId = null;
  }
  auctionState.isAuctionRunning = false;
  auctionState.isAuctionPaused = true;
  // Don't reset currentAuctionItemIndex here, keep it to show which item was stopped on
  saveData();
  messageElement.textContent = '경매가 중지되었습니다.';
  messageElement.classList.remove('green', 'red');
  messageElement.classList.add('orange');
  updateAuctionControls();
  renderAuctionPage();
}

// Reusable function for next auction item logic
function handleNextAuction(messageElement) {
  if (!auctionState.isAuctionRunning) {
    messageElement.textContent = '경매가 시작되지 않았습니다. "경매 시작"을 눌러주세요.';
    messageElement.classList.remove('green', 'orange');
    messageElement.classList.add('red');
    return;
  }
  startNextAuction(); // This function already updates auctionMasterMessage
}

masterStartAuctionBtn.addEventListener('click', () => handleStartAuction(auctionMasterMessage));
masterStopAuctionBtn.addEventListener('click', () => handleStopAuction(auctionMasterMessage));
masterNextAuctionBtn.addEventListener('click', () => handleNextAuction(auctionMasterMessage));

// --- NEW: Auction Page Master Controls Event Listeners ---
auctionPageStartAuctionBtn.addEventListener('click', () => handleStartAuction(auctionPageMasterMessage));
auctionPageStopAuctionBtn.addEventListener('click', () => handleStopAuction(auctionPageMasterMessage));
auctionPageNextAuctionBtn.addEventListener('click', () => handleNextAuction(auctionPageMasterMessage));

function updateAuctionControls() {
  const isEnded = isAuctionFullyEnded(); // Function name changed

  // Determine the message element based on the current page
  const currentMessageElement = document.getElementById('masterPage').classList.contains('active')
    ? auctionMasterMessage
    : auctionPageMasterMessage;

  // Master Page Controls
  masterStartAuctionBtn.disabled = auctionState.isAuctionRunning && !auctionState.isAuctionPaused && !isEnded;
  masterStopAuctionBtn.disabled = !auctionState.isAuctionRunning;
  masterNextAuctionBtn.disabled =
    !auctionState.isAuctionRunning || (!auctionState.isAuctionPaused && auctionState.timer > 0) || isEnded;

  // Auction Page Controls (NEW)
  auctionPageStartAuctionBtn.disabled = masterStartAuctionBtn.disabled;
  auctionPageStopAuctionBtn.disabled = masterStopAuctionBtn.disabled;
  auctionPageNextAuctionBtn.disabled = masterNextAuctionBtn.disabled;

  if (isEnded && !auctionState.isAuctionRunning) {
    // Condition changed
    currentMessageElement.textContent =
      '모든 팀이 매물 배정을 완료했습니다. 유찰 매물 배정을 진행하거나 경매를 다시 시작할 수 있습니다.';
    currentMessageElement.classList.remove('red', 'orange');
    currentMessageElement.classList.add('green');
    masterNextAuctionBtn.disabled = true;
    masterStopAuctionBtn.disabled = true;
    auctionPageNextAuctionBtn.disabled = true;
    auctionPageStopAuctionBtn.disabled = true;
    masterStartAuctionBtn.disabled = false;
    auctionPageStartAuctionBtn.disabled = false;

    if (currentUser && currentUser.role === USER_ROLE.MASTER) {
      unbidItemAssignmentSection.style.display = 'flex';
      populateUnbidItemsList(unbidItemsListMasterPage);
      populateUnbidItemsTeamsList(unbidItemsTeamsListMasterPage);
      unbidItemAssignMessageMasterPage.textContent = '';
    }
    // NEW: Show auction results section when auction is fully ended by participant assignment
    if (currentUser && currentUser.role === USER_ROLE.MASTER) {
      auctionResultsSection.style.display = 'block';
    }
  } else if (!auctionState.isAuctionRunning && auctionState.currentAuctionItemIndex === -1) {
    // No items currently being auctioned and auction not running
    currentMessageElement.textContent = '경매 시작을 기다립니다.';
    currentMessageElement.classList.remove('red', 'green');
    currentMessageElement.classList.add('orange');
    unbidItemAssignmentSection.style.display = 'none';
    auctionResultsSection.style.display = 'none'; // Hide if not fully ended
  } else if (
    !auctionState.isAuctionRunning &&
    items.length === 0 &&
    users.filter((u) => u.role === USER_ROLE.GENERAL).length === 0
  ) {
    // No items at all and no general users to auction
    currentMessageElement.textContent = '경매할 참여자 또는 매물이 없습니다. 마스터 페이지에서 등록해주세요.';
    currentMessageElement.classList.remove('green', 'orange');
    currentMessageElement.classList.add('red');
    unbidItemAssignmentSection.style.display = 'none';
    auctionResultsSection.style.display = 'none'; // Hide if not fully ended
  } else if (
    auctionState.isAuctionRunning &&
    auctionState.isAuctionPaused &&
    auctionState.currentAuctionItemIndex !== -1
  ) {
    currentMessageElement.textContent = '경매 일시정지: 다음 매물 대기 중. "다음 매물"을 클릭하세요.';
    currentMessageElement.classList.remove('red', 'green');
    currentMessageElement.classList.add('orange');
    unbidItemAssignmentSection.style.display = 'none';
    auctionResultsSection.style.display = 'none'; // Hide if not fully ended
  } else {
    unbidItemAssignmentSection.style.display = 'none';
    auctionResultsSection.style.display = 'none'; // Default to hidden
  }
}

function startNextAuction() {
  if (auctionState.intervalId) {
    clearInterval(auctionState.intervalId);
    auctionState.intervalId = null;
  }

  // NEW: 데이터 일관성 강제 (이전 답변에서 추가된 부분 유지)
  // 이 루프는 GENERAL 사용자가 팀에 할당되지 않은 경우, 해당 사용자를 나타내는 아이템도 판매되지 않은 것으로 표시되도록 합니다.
  // 이는 잠재적인 불일치를 수정하는 데 도움이 됩니다.
  users
    .filter((u) => u.role === USER_ROLE.GENERAL)
    .forEach((user) => {
      const itemForUser = items.find((item) => item.participantId === user.id);
      if (itemForUser) {
        if (user.teamId === null && itemForUser.isSold) {
          itemForUser.isSold = false;
          itemForUser.bidderTeamId = null;
          itemForUser.bidPrice = 0;
          console.log(`[DATA CORRECTION] Item for ${user.username} was incorrectly marked as sold. Resetting.`);
        } else if (user.teamId !== null && !itemForUser.isSold) {
          itemForUser.isSold = true;
          if (itemForUser.bidderTeamId !== user.teamId) {
            itemForUser.bidderTeamId = user.teamId;
            itemForUser.bidPrice = 0;
          }
          console.log(
            `[DATA CORRECTION] Item for ${user.username} was unassigned but their user IS assigned. Marking as sold.`
          );
        }
      }
    });

  // Step 1: `unassignedGeneralUsers`를 먼저 정확하게 필터링
  // teamId가 null인 GENERAL 역할 사용자만 필터링합니다.
  const unassignedGeneralUsers = users.filter((u) => u.role === USER_ROLE.GENERAL && u.teamId === null);

  let nextItem = null;
  let nextItemIndex = -1;

  // Step 2: `unassignedGeneralUsers` 목록을 기반으로 경매할 매물을 찾거나 생성
  // `unassignedGeneralUsers`의 순서를 기반으로 다음 매물을 찾습니다.
  // 이렇게 하면 어떤 유저가 다음 대상인지 명확해집니다.
  for (const user of unassignedGeneralUsers) {
    // 이 사용자를 나타내는 기존 매물이 있는지 찾습니다.
    // 이 매물은 아직 판매되지 않은 상태여야 합니다.
    const existingItemForUser = items.find((item) => item.participantId === user.id && !item.isSold);

    if (existingItemForUser) {
      nextItem = existingItemForUser;
      nextItemIndex = items.indexOf(existingItemForUser);
      break; // 찾았으면 반복 중단
    } else {
      // 기존 매물이 없거나 팔렸다면, 이 사용자를 위한 새 매물을 만듭니다.
      const newItemForUser = {
        id: `item_auction_${user.id}`,
        name: user.username,
        description: `참여자 경매 매물: ${user.username}`,
        image: `https://api.dicebear.com/8.x/bottts/svg?seed=${user.username}`,
        bidPrice: 0,
        bidderTeamId: null,
        isSold: false,
        participantId: user.id,
      };
      items.push(newItemForUser);
      nextItem = newItemForUser;
      nextItemIndex = items.length - 1;
      break; // 새 매물을 만들었으면 반복 중단
    }
  }

  if (nextItem) {
    auctionState.currentAuctionItemIndex = nextItemIndex;
    auctionState.currentBid = 0;
    auctionState.currentBidderTeamId = null;
    auctionState.timer = 3; // 1분 = 60초
    auctionState.isAuctionPaused = false;
    auctionState.currentAuctionStartTime = Date.now();

    updateAuctionDisplay(nextItem);
    startTimer();

    // Bid button enabled for team leaders on auction page
    if (currentUser && currentUser.role !== USER_ROLE.MASTER) {
      // Master cannot bid
      bidButton.disabled = currentUser.role !== USER_ROLE.TEAM_LEADER;
      bidButton.textContent = '입찰 (100P)';
    } else {
      bidButton.style.display = 'none'; // Master's bid button hidden
      auctionPageMasterControls.style.display = 'flex'; // Master controls shown
      auctionPageMasterMessage.textContent = `새 매물 '${nextItem.name}' 경매 시작!`;
      auctionPageMasterMessage.classList.remove('red', 'orange');
      auctionPageMasterMessage.classList.add('green');
    }
    auctionMasterMessage.textContent = `새 매물 '${nextItem.name}' 경매 시작!`; // Also update master page message
    auctionMasterMessage.classList.remove('red', 'orange');
    auctionMasterMessage.classList.add('green');
  } else {
    // 모든 GENERAL 사용자가 팀에 할당되었거나 더 이상 경매할 사용자가 없습니다.
    // 또는, 모든 팀이 5개 매물을 낙찰받아 더 이상 매물을 받을 수 없는 경우
    endAuction();
    return;
  }
  saveData();
  renderAuctionPage(); // Update UI on all connected clients/pages
  updateAuctionControls(); // Update master controls on master page
}

function updateAuctionDisplay(item) {
  // Determine if current user is master and toggle controls/bid button
  if (currentUser && currentUser.role === USER_ROLE.MASTER) {
    auctionPageMasterControls.style.display = 'flex';
    bidButton.style.display = 'none';
    // Display messages for master on auction page
    const message = document.getElementById('auctionPageMasterMessage');
    const masterPageMessage = document.getElementById('auctionMasterMessage'); // Also update the one on master page for consistency

    const isEnded = isAuctionFullyEnded(); // Function name changed
    if (isEnded && !auctionState.isAuctionRunning) {
      // Condition changed
      message.textContent =
        '모든 팀이 매물 배정을 완료했습니다. 유찰 매물 배정을 진행하거나 경매를 다시 시작할 수 있습니다.';
      masterPageMessage.textContent =
        '모든 팀이 매물 배정을 완료했습니다. 유찰 매물 배정을 진행하거나 경매를 다시 시작할 수 있습니다.';
      message.classList.remove('red', 'orange');
      message.classList.add('green');
      masterPageMessage.classList.remove('red', 'orange');
      masterPageMessage.classList.add('green');
    } else if (auctionState.isAuctionRunning && !auctionState.isAuctionPaused && item) {
      message.textContent = `경매 진행 중: ${item.name}`;
      masterPageMessage.textContent = `경매 진행 중: ${item.name}`;
      message.classList.remove('red', 'orange');
      message.classList.add('green');
      masterPageMessage.classList.remove('red', 'orange');
      masterPageMessage.classList.add('green');
    } else if (
      auctionState.isAuctionRunning &&
      auctionState.isAuctionPaused &&
      auctionState.currentAuctionItemIndex !== -1
    ) {
      message.textContent = `경매 일시정지: ${item ? item.name : '매물 없음'}. 다음 매물 대기 중.`;
      masterPageMessage.textContent = `경매 일시정지: ${item ? item.name : '매물 없음'}. 다음 매물 대기 중.`;
      message.classList.remove('red', 'green');
      message.classList.add('orange');
      masterPageMessage.classList.remove('red', 'green');
      masterPageMessage.classList.add('orange');
    } else {
      message.textContent = '경매 시작을 기다립니다.';
      masterPageMessage.textContent = '경매 시작을 기다립니다.';
      message.classList.remove('red', 'green');
      message.classList.add('orange');
      masterPageMessage.classList.remove('red', 'green');
      masterPageMessage.classList.add('orange');
    }
  } else {
    // Not master (Team Leader or General)
    auctionPageMasterControls.style.display = 'none';
    bidButton.style.display = 'block';
  }

  if (item && auctionState.isAuctionRunning && !auctionState.isAuctionPaused) {
    // Show if active auction
    noItemMessage.style.display = 'none'; // Hide "no item" message
    currentItemImage.src = item.image || `https://api.dicebear.com/8.x/bottts/svg?seed=${item.name}`; // Default if no image
    currentItemImage.style.display = 'block';

    // If it's a participant item, display username, otherwise item name
    const displayItemName = item.participantId
      ? users.find((u) => u.id === item.participantId)?.username || '알 수 없는 참여자'
      : item.name;
    const displayItemDesc = item.participantId ? `참여자: ${displayItemName} (매물)` : item.description || '없음';

    currentItemName.textContent = `매물명: ${displayItemName}`;
    currentItemDescription.textContent = `설명: ${displayItemDesc}`;
    currentBidInfo.style.display = 'flex'; // Change to flex to match CSS
    updateBidInfo(); // Ensure bid info is current
    timeCountDisplay.textContent = `TIME COUNT: ${String(Math.floor(auctionState.timer / 60)).padStart(
      2,
      '0'
    )}:${String(auctionState.timer % 60).padStart(2, '0')}`;

    // If current user is master, bid button is irrelevant, otherwise enable/disable based on auction state
    if (currentUser && currentUser.role === USER_ROLE.MASTER) {
      bidButton.disabled = true; // Master cannot bid
    } else {
      bidButton.disabled = currentUser.role !== USER_ROLE.TEAM_LEADER;
      bidButton.textContent = '입찰 (100P)';
    }
  } else {
    // No item or auction not running / paused
    noItemMessage.style.display = 'block';
    // NEW: Check for auction end by participant assignment
    const isEnded = isAuctionFullyEnded(); // Function name changed

    if (isEnded && !auctionState.isAuctionRunning) {
      // Condition changed
      currentItemName.textContent = '모든 팀이 매물 배정을 완료했습니다.';
      currentItemDescription.textContent =
        currentUser && currentUser.role === USER_ROLE.MASTER
          ? '마스터 권한으로 유찰 매물을 배정하거나, 경매를 다시 시작할 수 있습니다.'
          : '경매가 종료되었습니다. 마스터가 경매를 다시 시작할 때까지 기다려주세요.';
    } else if (
      auctionState.isAuctionRunning &&
      auctionState.isAuctionPaused &&
      auctionState.currentAuctionItemIndex !== -1
    ) {
      // Auction paused on a specific item
      const currentItem = items[auctionState.currentAuctionItemIndex]; // Access directly since index is now in full array
      if (currentItem) {
        noItemMessage.style.display = 'none'; // Hide "no item" message
        currentItemImage.src = currentItem.image || `https://api.dicebear.com/8.x/bottts/svg?seed=${currentItem.name}`; // Default if no image
        currentItemImage.style.display = 'block';

        const displayItemName = currentItem.participantId
          ? users.find((u) => u.id === currentItem.participantId)?.username || '알 수 없는 참여자'
          : currentItem.name;
        const displayItemDesc = currentItem.participantId
          ? `참여자: ${displayItemName} (매물)`
          : currentItem.description || '없음';

        currentItemName.textContent = `매물명: ${displayItemName}`;
        currentItemDescription.textContent = `설명: ${displayItemDesc} (경매 일시정지)`;
        currentBidInfo.style.display = 'flex'; // Change to flex to match CSS
        updateBidInfo(); // Ensure bid info is current
        timeCountDisplay.textContent = `TIME COUNT: ${String(Math.floor(auctionState.timer / 60)).padStart(
          2,
          '0'
        )}:${String(auctionState.timer % 60).padStart(2, '0')}`;
      } else {
        // Should not happen if index is valid but item somehow missing
        currentItemName.textContent = '경매가 대기 중입니다.';
        currentItemDescription.textContent = '마스터가 다음 매물을 시작할 때까지 기다려주세요.';
      }
    } else {
      // 경매가 시작되지 않았거나, 중지된 상태 (아이템 없음)
      currentItemName.textContent = '현재 진행 중인 매물이 없습니다.';
      currentItemDescription.textContent = '마스터가 경매를 시작할 때까지 기다려주세요.';
    }

    currentItemImage.style.display = 'none';
    currentBidInfo.style.display = 'none';
    timeCountDisplay.textContent = 'TIME COUNT: 00:00';
    if (currentUser && currentUser.role !== USER_ROLE.MASTER) {
      // Only disable bid button if not master
      bidButton.disabled = true;
      if (currentUser && currentUser.role === USER_ROLE.GENERAL) {
        bidButton.textContent = '입찰 권한 없음';
      } else if (currentUser && currentUser.role === USER_ROLE.TEAM_LEADER) {
        bidButton.textContent = isEnded ? '경매 종료' : '경매 대기'; // Changed message
      }
    }
  }
}

function updateBidInfo() {
  const team = teams.find((t) => t.id === auctionState.currentBidderTeamId);
  currentBidValue.textContent = auctionState.currentBid.toLocaleString();
  currentBidTeam.textContent = team ? team.name : '없음';
}

function startTimer() {
  // Check if an interval is already running to prevent duplicates
  if (auctionState.intervalId) {
    clearInterval(auctionState.intervalId);
  }

  // Set a new interval
  auctionState.intervalId = setInterval(() => {
    auctionState.timer--;

    // Update display for all connected clients/pages immediately
    // This is crucial for cross-page synchronization
    document.getElementById('timeCount').textContent = `TIME COUNT: ${String(
      Math.floor(auctionState.timer / 60)
    ).padStart(2, '0')}:${String(auctionState.timer % 60).padStart(2, '0')}`;

    saveData(); // Save timer state to local storage

    if (auctionState.timer <= 0) {
      clearInterval(auctionState.intervalId);
      auctionState.intervalId = null;
      handleAuctionEndRound(); // Handle end of the current bid period for an item
    }
  }, 1000);
}

function handleAuctionEndRound() {
  bidButton.disabled = true;
  auctionState.isAuctionPaused = true; // Pause auction after timer ends
  saveData(); // Save paused state

  const currentItem = items[auctionState.currentAuctionItemIndex];

  if (!currentItem) {
    alert('경매를 종료할 매물 정보를 찾을 수 없습니다. 경매를 재시작하거나 마스터에게 문의하세요.');
    endAuction(); // End overall auction if no current item found
    return;
  }

  const participantUser = currentItem.participantId ? users.find((u) => u.id === currentItem.participantId) : null;

  if (auctionState.currentBid > 0 && auctionState.currentBidderTeamId) {
    const winningTeam = teams.find((t) => t.id === auctionState.currentBidderTeamId);
    const winningLeader = users.find((u) => u.id === winningTeam?.leaderId);

    if (winningTeam && winningLeader) {
      if (winningTeam.itemsWon.length < 5) {
        winningLeader.points -= auctionState.currentBid;
        winningTeam.points = winningLeader.points; // Sync team points

        // Ensure item ID is not added multiple times if somehow already present
        if (!winningTeam.itemsWon.includes(currentItem.id)) {
          winningTeam.itemsWon.push(currentItem.id);
        }

        currentItem.isSold = true;
        currentItem.bidderTeamId = winningTeam.id; // Record winning team
        currentItem.bidPrice = auctionState.currentBid;

        // If the item represents a participant, update their teamId
        if (participantUser) {
          participantUser.teamId = winningTeam.id; // Assign participant to winning team
        }

        alert(
          `${winningTeam.name}이(가) '${
            currentItem.name
          }' 매물을 ${auctionState.currentBid.toLocaleString()}P에 낙찰받았습니다! 남은 포인트: ${winningLeader.points.toLocaleString()}P`
        );
      } else {
        alert(
          `'${currentItem.name}' 매물이 경매 종료되었습니다. ${winningTeam.name}은(는) 이미 5개 매물을 낙찰받아 추가 낙찰할 수 없습니다. (유찰 처리)`
        );
        // If winner already has 5 items, this item goes unsold.
        currentItem.isSold = false;
        currentItem.bidderTeamId = null;
        currentItem.bidPrice = 0;
        // --- CRITICAL FIX: If a participant item becomes unbid/unassigned, clear their teamId ---
        if (participantUser) {
          participantUser.teamId = null;
        }
      }
    } else {
      alert(`'${currentItem.name}'이(가) 유효하지 않은 팀장/팀 정보로 인해 유찰되었습니다.`);
      currentItem.isSold = false;
      currentItem.bidderTeamId = null;
      currentItem.bidPrice = 0;
      // --- CRITICAL FIX: If a participant item becomes unbid/unassigned, clear their teamId ---
      if (participantUser) {
        participantUser.teamId = null;
      }
    }
  } else {
    alert(`'${currentItem.name}'이(가) 유찰되었습니다. (입찰 없음)`);
    currentItem.isSold = false;
    currentItem.bidderTeamId = null;
    currentItem.bidPrice = 0;
    // --- CRITICAL FIX: If a participant item becomes unbid/unassigned, clear their teamId ---
    if (participantUser) {
      participantUser.teamId = null;
    }
  }
  saveData();
  // After handling the round, check if all teams are full
  if (isAuctionFullyEnded()) {
    // Function name changed
    endAuction();
  } else {
    renderAuctionPage(); // Update UI on all connected clients/pages
    updateAuctionControls(); // Update master's 'Next' button state
  }
}

function endAuction() {
  if (auctionState.intervalId) {
    clearInterval(auctionState.intervalId);
    auctionState.intervalId = null;
  }
  auctionState.isAuctionRunning = false;
  auctionState.isAuctionPaused = true;
  auctionState.currentAuctionItemIndex = -1; // Reset index to indicate no active item
  auctionState.currentBid = 0; // Clear bid
  auctionState.currentBidderTeamId = null; // Clear bidder
  saveData();

  updateAuctionControls(); // Master controls updated to allow new auction or show unbid section
  alert('경매가 종료되었습니다. 모든 팀이 매물 배정을 완료했습니다.'); // Message changed

  // NEW: 경매 종료 시, 마스터라면 경매 결과 섹션 표시
  if (currentUser && currentUser.role === USER_ROLE.MASTER) {
    auctionResultsSection.style.display = 'block';
  }
  renderAuctionPage(); // Ensure auction page is updated to show "auction ended" message
}

// 입찰 기능
bidButton.addEventListener('click', () => {
  if (!currentUser || currentUser.role !== USER_ROLE.TEAM_LEADER) {
    alert('팀장만 입찰할 수 있습니다.');
    return;
  }

  const currentItem = items[auctionState.currentAuctionItemIndex];
  if (!currentItem || auctionState.timer <= 0 || auctionState.isAuctionPaused) {
    alert('현재 진행 중인 경매가 없거나 시간이 종료되었거나 경매가 일시정지 상태입니다.');
    return;
  }

  const biddingTeam = teams.find((t) => t.leaderId === currentUser.id);
  if (!biddingTeam) {
    alert('당신은 팀장이 아닙니다. 경매에 참여할 수 없습니다.');
    return;
  }

  // 최대 5개 낙찰 제한 확인
  if (biddingTeam.itemsWon.length >= 5) {
    alert('이미 5개의 매물을 낙찰받아 더 이상 입찰할 수 없습니다.');
    return;
  }

  const nextBid = auctionState.currentBid + 100;

  // 포인트 확인
  if (currentUser.points < nextBid) {
    alert(`포인트가 부족합니다! 현재 ${currentUser.points.toLocaleString()}P 있습니다.`);
    return;
  }

  // 입찰 업데이트
  auctionState.currentBid = nextBid;
  auctionState.currentBidderTeamId = biddingTeam.id;

  // 입찰 시 타이머 리셋
  auctionState.timer = 30; // 30초로 리셋 (조절 가능)
  auctionState.currentAuctionStartTime = Date.now(); // Reset start time for timer synchronization

  updateBidInfo();
  renderParticipantGrid(); // 입찰자 하이라이트 업데이트
  saveData(); // 입찰 상태 저장
});

// --- 경매 페이지 UI 렌더링 ---
function renderAuctionPage() {
  renderTeamList();
  renderParticipantGrid();

  // Update auction display based on current auction state
  const currentItem = auctionState.currentAuctionItemIndex !== -1 ? items[auctionState.currentAuctionItemIndex] : null;
  updateAuctionDisplay(currentItem);

  // Auction results section display logic (only for master when auction is fully ended)
  // NEW: Use isAuctionFullyEnded()
  if (currentUser && currentUser.role === USER_ROLE.MASTER && isAuctionFullyEnded() && !auctionState.isAuctionRunning) {
    // Function name changed
    auctionResultsSection.style.display = 'block';
  } else {
    auctionResultsSection.style.display = 'none';
  }

  // Master controls vs. Bid button visibility on auction page
  if (currentUser && currentUser.role === USER_ROLE.MASTER) {
    auctionPageMasterControls.style.display = 'flex';
    bidButton.style.display = 'none';
  } else {
    auctionPageMasterControls.style.display = 'none';
    bidButton.style.display = 'block';
  }
}

function renderTeamList() {
  teamListContainer.innerHTML = '';
  teams.forEach((team) => {
    const teamLeader = users.find((u) => u.id === team.leaderId);
    const teamItem = document.createElement('div');
    teamItem.classList.add('team-item');

    // Use a placeholder image or DiceBear for team avatar
    const teamAvatarSrc = `https://api.dicebear.com/8.x/bottts/svg?seed=${team.name}`;

    let teamColor = '#555'; // Default
    switch (team.name) {
      case 'Random Team A':
        teamColor = '#1abc9c';
        break; // Emerald Green
      case 'Random Team B':
        teamColor = '#3498db';
        break; // Peter River Blue
      case 'Random Team C':
        teamColor = '#9b59b6';
        break; // Amethyst Purple
      // Add more colors for other teams if needed
    }

    teamItem.innerHTML = `
            <div class="team-avatar" style="background-image: url(${teamAvatarSrc}); background-size: cover; background-color: ${teamColor};"></div>
            <div class="team-info">
                <div class="team-name" style="color: ${teamColor};">${team.name}</div>
                <div class="team-points">포인트: ${team.points.toLocaleString()}P</div>
            </div>
            <div class="team-slots">
                ${Array(5)
                  .fill()
                  .map((_, i) => `<div class="slot-indicator ${team.itemsWon.length > i ? 'filled' : ''}"></div>`)
                  .join('')}
            </div>
        `;
    teamListContainer.appendChild(teamItem);
  });
}

function renderParticipantGrid() {
  participantGrid.innerHTML = '';

  users.forEach((user) => {
    // 마스터는 제외 (별도로 관리)
    if (user.role === USER_ROLE.MASTER) {
      return;
    }

    // --- CRITICAL FIX: Only display GENERAL users if they are NOT assigned to a team (teamId is null) ---
    // Team Leaders are always displayed.
    if (user.role === USER_ROLE.GENERAL && user.teamId !== null) {
      return; // Skip assigned general users from the grid
    }

    const participantAvatar = document.createElement('div');
    participantAvatar.classList.add('participant-avatar');

    let borderColorClass = '';
    // Check if the user is the current auction item (only applies to GENERAL users)
    const currentAuctionItem =
      auctionState.currentAuctionItemIndex !== -1 ? items[auctionState.currentAuctionItemIndex] : null;
    const isCurrentAuctionItem = currentAuctionItem && currentAuctionItem.participantId === user.id;

    if (user.role === USER_ROLE.TEAM_LEADER) {
      borderColorClass = 'border-team-leader';
    } else if (isCurrentAuctionItem) {
      borderColorClass = 'border-auction-item'; // Green for current auction item
    } else {
      borderColorClass = 'border-general'; // Grey for general participants not currently up for auction
    }
    participantAvatar.classList.add(borderColorClass);

    // 최고 입찰자 테두리 추가 (팀장에게만 적용)
    if (user.role === USER_ROLE.TEAM_LEADER && auctionState.currentBidderTeamId === user.teamId) {
      participantAvatar.classList.add('active-bidder');
    }

    participantAvatar.title = `${user.username} (${
      user.role === USER_ROLE.TEAM_LEADER ? teams.find((t) => t.leaderId === user.id)?.name || '팀장' : user.role
    })`;
    participantAvatar.style.backgroundImage = `url(https://api.dicebear.com/8.x/bottts/svg?seed=${user.username})`;
    participantAvatar.style.backgroundSize = 'cover';
    participantAvatar.style.backgroundPosition = 'center';
    participantAvatar.style.textIndent = '-9999px'; // Hide text for avatar image
    participantGrid.appendChild(participantAvatar);
  });
}

// --- 1. 팀별 배치 결과 다운로드 (HTML 보고서 생성) ---
downloadTeamResultsBtn.addEventListener('click', () => {
  generateTeamResultsReport();
});

function generateTeamResultsReport() {
  let reportContent = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>경매 팀별 배치 결과</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background-color: #f4f7f6; color: #333; }
                .container { max-width: 900px; margin: 0 auto; padding: 25px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
                h1 { text-align: center; color: #2c3e50; margin-bottom: 30px; font-size: 2.2em; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                h2 { color: #34495e; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; font-size: 1.6em; }
                .team-section { margin-bottom: 40px; padding: 20px; background-color: #ecf0f1; border-radius: 8px; border: 1px solid #dde1e6; }
                .team-header { display: flex; align-items: center; margin-bottom: 15px; }
                .team-avatar { width: 60px; height: 60px; border-radius: 50%; background-color: #3498db; display: flex; justify-content: center; align-items: center; font-size: 1.8em; color: white; font-weight: bold; margin-right: 15px; overflow: hidden; }
                .team-avatar img { width: 100%; height: 100%; object-fit: cover; } /* For DiceBear image */
                .team-name-leader { font-size: 1.5em; font-weight: bold; color: #2980b9; }
                .team-leader-info { font-size: 0.9em; color: #555; margin-left: 10px; }
                .team-points { font-size: 1.1em; font-weight: bold; color: #e74c3c; margin-top: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; background-color: #fff; }
                th, td { border: 1px solid #bdc3c7; padding: 12px 15px; text-align: left; }
                th { background-color: #3498db; color: white; font-weight: bold; }
                tr:nth-child(even) { background-color: #f8fcfd; }
                .no-items { text-align: center; color: #7f8c8d; padding: 10px; font-style: italic; }
                .item-icon { width: 30px; height: 30px; border-radius: 50%; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 8px; border: 1px solid #ccc;}
                .item-icon img { width: 100%; height: 100%; object-fit: cover; }
                .item-name { vertical-align: middle; }
                .page-break { page-break-before: always; } /* For printing */
            </style>
        </head>
        <body>
            <div class="container">
                <h1>경매 최종 결과</h1>
    `;

  teams.forEach((team) => {
    const leader = users.find((u) => u.id === team.leaderId);
    // NEW: Get team members (GENERAL users assigned to this team)
    const teamMembers = users.filter((u) => u.teamId === team.id && u.role === USER_ROLE.GENERAL);
    const itemsWon = items.filter((item) => team.itemsWon.includes(item.id));
    const teamAvatarSrc = `https://api.dicebear.com/8.x/bottts/svg?seed=${team.name}`;

    reportContent += `
            <div class="team-section">
                <div class="team-header">
                    <div class="team-avatar" style="background-image: url(${teamAvatarSrc}); background-size: cover;"></div>
                    <span class="team-name-leader">${team.name}</span>
                    <span class="team-leader-info">(팀장: ${leader ? leader.username : '없음'})</span>
                </div>
                <div class="team-points">남은 포인트: ${team.points.toLocaleString()}P</div>

                <h2>팀원 (${teamMembers.length} 명)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>역할</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          leader
                            ? `
                            <tr>
                                <td>${leader.username}</td>
                                <td>팀장</td>
                            </tr>
                        `
                            : `
                            <tr>
                                <td colspan="2" class="no-items">팀장이 없습니다.</td>
                            </tr>
                        `
                        }
                        ${
                          teamMembers.length > 0
                            ? teamMembers
                                .map(
                                  (member) => `
                            <tr>
                                <td>${member.username}</td>
                                <td>팀원</td>
                            </tr>
                        `
                                )
                                .join('')
                            : leader
                            ? ''
                            : `
                            <tr>
                                <td colspan="2" class="no-items">팀원이 없습니다.</td>
                            </tr>
                        `
                        }
                    </tbody>
                </table>

                <h2>낙찰 매물 (${itemsWon.length} / 5)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>아이콘</th>
                            <th>매물 이름</th>
                            <th>낙찰 가격</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          itemsWon.length > 0
                            ? itemsWon
                                .map((item) => {
                                  const itemNameDisplay = item.participantId
                                    ? users.find((u) => u.id === item.participantId)?.username || '알 수 없는 참여자'
                                    : item.name;
                                  const itemIconSrc =
                                    item.image || `https://api.dicebear.com/8.x/bottts/svg?seed=${itemNameDisplay}`; // Use item image or generate from name
                                  return `
                                <tr>
                                    <td><div class="item-icon"><img src="${itemIconSrc}" alt="${itemNameDisplay
                                    .charAt(0)
                                    .toUpperCase()}"></div></td>
                                    <td><span class="item-name">${itemNameDisplay}</span></td>
                                    <td>${item.bidPrice.toLocaleString()}P</td>
                                </tr>
                            `;
                                })
                                .join('')
                            : `
                            <tr>
                                <td colspan="3" class="no-items">낙찰된 매물이 없습니다.</td>
                            </tr>
                        `
                        }
                    </tbody>
                </table>
            </div>
        `;
  });

  // 유찰 매물 섹션 추가 (어떤 팀에도 배정되지 않은 참여자들)
  // Filter for GENERAL users who are not yet assigned to any team
  const unassignedGeneralUsers = users.filter((u) => u.role === USER_ROLE.GENERAL && u.teamId === null);
  if (unassignedGeneralUsers.length > 0) {
    reportContent += `
            <div class="team-section">
                <div class="team-header">
                    <span class="team-name-leader">미배치 참여자</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>아이콘</th>
                            <th>참여자 이름</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${unassignedGeneralUsers
                          .map((user) => {
                            const userIconSrc = `https://api.dicebear.com/8.x/bottts/svg?seed=${user.username}`;
                            return `
                                <tr>
                                    <td><div class="item-icon"><img src="${userIconSrc}" alt="${user.username
                              .charAt(0)
                              .toUpperCase()}"></div></td>
                                    <td><span class="item-name">${user.username} (미배치)</span></td>
                                </tr>
                            `;
                          })
                          .join('')}
                    </tbody>
                </table>
            </div>
        `;
  }

  reportContent += `
            </div>
        </body>
        </html>
    `;

  const newWindow = window.open();
  newWindow.document.write(reportContent);
  newWindow.document.close();
  newWindow.print(); // PDF 저장을 위해 브라우저의 인쇄 대화 상자를 띄움
}

// --- 2. JSON 형태의 데이터 파일 다운로드 ---
downloadJsonDataBtn.addEventListener('click', () => {
  downloadJsonData();
});

function downloadJsonData() {
  const dataToDownload = {
    users: users,
    teams: teams,
    items: items,
    auctionState: auctionState,
  };

  const filename = `auction_data_${new Date().toISOString().slice(0, 10)}.json`; // e.g., auction_data_2025-07-22.json
  const jsonString = JSON.stringify(dataToDownload, null, 2); // null, 2 for pretty printing

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Clean up
}

// --- 초기화 및 실행 ---
document.addEventListener('DOMContentLoaded', () => {
  initializeData();
  loadData(); // Load any previously saved state

  // Determine which page to show on load
  if (currentUser) {
    if (currentUser.role === USER_ROLE.MASTER) {
      showPage('masterPage');
    } else {
      showPage('auctionPage');
    }
  } else {
    showPage('loginPage');
  }
});