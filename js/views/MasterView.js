export class MasterView {
  constructor() {
    // Master 페이지 DOM 요소 캐싱
    this.masterUsernameDisplay = document.getElementById('masterUsernameDisplay');
    this.createdTeamsList = document.getElementById('createdTeamsList');
    this.currentTeamLeadersList = document.getElementById('currentTeamLeadersList');
    this.registeredItemsList = document.getElementById('registeredItemsList');

    this.auctionMasterMessage = document.getElementById('auctionMasterMessage');

    // 현재 매물 표시용 (Master 전용)
    this.currentItemName = document.getElementById('masterCurrentItemName');
    this.currentItemDescription = document.getElementById('masterCurrentItemDescription');
    this.currentItemImage = document.getElementById('masterCurrentItemImage');
    this.currentBidInfo = document.getElementById('masterCurrentBidInfo');
    this.currentBidValue = document.getElementById('masterCurrentBidValue');
    this.currentBidTeam = document.getElementById('masterCurrentBidTeam');
    this.timeCountDisplay = document.getElementById('masterTimeCount');
    this.noItemMessage = document.getElementById('masterNoItemMessage');
  }

  render(users, teams, items) {
    this.renderTeams(teams, users);
    this.renderItems(items, teams, users);
    this.renderTeamLeaders(teams, users);
  }

  renderTeams(teams, users) {
    this.createdTeamsList.innerHTML = '';
    this.createdTeamsList.classList.add('list-display');
    teams.forEach(team => {
      const leader = users.find(u => u.id === team.leaderId);
      const li = document.createElement('li');
      li.textContent = `${team.name} (팀장: ${leader ? leader.username : '없음'})`;
      this.createdTeamsList.appendChild(li);
    });
  }

  renderTeamLeaders(teams, users) {
    this.currentTeamLeadersList.innerHTML = '';
    this.currentTeamLeadersList.classList.add('list-display');
    teams.filter(t => t.leaderId).forEach(team => {
      const leader = users.find(u => u.id === team.leaderId);
      if (!leader) return;
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${team.name} - ${leader.username}</span>
        <button class="delete" data-team-id="${team.id}">해제</button>
      `;
      this.currentTeamLeadersList.appendChild(li);
    });
  }

  renderItems(items, teams, users) {
    this.registeredItemsList.innerHTML = '';
    this.registeredItemsList.classList.add('list-display');
    items.forEach(item => {
      const displayName = item.participantId
        ? (users.find(u => u.id === item.participantId)?.username || '알 수 없음')
        : item.name;

      const status = item.isSold
        ? `(판매 완료 - ${teams.find(t => t.id === item.bidderTeamId)?.name || '팀 없음'})`
        : '(경매 대기)';

      const li = document.createElement('li');
      li.innerHTML = `
        <span>${displayName} ${status}</span>
        <button class="delete" data-item-id="${item.id}">삭제</button>
      `;
      this.registeredItemsList.appendChild(li);
    });
  }

  renderCurrentItem(item, auctionState, users, teams) {
    if (!item) {
      this.noItemMessage.style.display = 'block';
      this.currentItemImage.style.display = 'none';
      this.currentBidInfo.style.display = 'none';
      this.currentItemName.textContent = '경매 대기 중';
      this.currentItemDescription.textContent = '마스터가 경매를 시작합니다.';
      return;
    }

    this.noItemMessage.style.display = 'none';
    this.currentItemImage.src = item.image || '';
    this.currentItemImage.style.display = 'block';
    const displayName = item.participantId
      ? (users.find(u => u.id === item.participantId)?.username || '참여자')
      : item.name;
    this.currentItemName.textContent = `매물: ${displayName}`;
    this.currentItemDescription.textContent = item.description || '설명 없음';
    this.currentBidInfo.style.display = 'flex';
    this.updateBidInfo(auctionState, teams);
  }

  updateBidInfo(auctionState, teams) {
    const team = teams.find(t => t.id === auctionState.currentBidderTeamId);
    this.currentBidValue.textContent = auctionState.currentBid.toLocaleString();
    this.currentBidTeam.textContent = team ? team.name : '없음';
  }

  updateTimer(seconds) {
    this.timeCountDisplay.textContent = `남은 시간: ${String(seconds).padStart(2, '0')}초`;
    this.timeCountDisplay.classList.add('time-count');
  }

  updateAuctionControls(auctionState, items, teams) {
    const isEnded = items.every(i => i.isSold) || teams.every(t => t.itemsWon.length >= 5);
    const canStart = !auctionState.isAuctionRunning || isEnded;
    const canStop = auctionState.isAuctionRunning;
    const canNext = auctionState.isAuctionRunning && auctionState.isAuctionPaused && !isEnded;

    document.getElementById('masterStartAuctionBtn').disabled = !canStart;
    document.getElementById('masterStopAuctionBtn').disabled = !canStop;
    document.getElementById('masterNextAuctionBtn').disabled = !canNext;

    // 버튼 스타일 통일 (CSS 적용)
    ['masterStartAuctionBtn', 'masterStopAuctionBtn', 'masterNextAuctionBtn'].forEach(id => {
      document.getElementById(id).classList.add('control-btn');
    });
    document.getElementById('masterStartAuctionBtn').classList.add('green');
    document.getElementById('masterStopAuctionBtn').classList.add('red');
    document.getElementById('masterNextAuctionBtn').classList.add('blue');
  }

  showMessage(msg, type = 'green') {
    this.auctionMasterMessage.textContent = msg;
    this.auctionMasterMessage.className = `message ${type}`;
  }
}
