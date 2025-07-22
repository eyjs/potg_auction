export class AuctionView {
  constructor(currentUser) {
    this.currentUser = currentUser;

    // Auction 페이지 DOM 캐싱
    this.currentItemName = document.getElementById('auctionCurrentItemName');
    this.currentItemDescription = document.getElementById('auctionCurrentItemDescription');
    this.currentItemImage = document.getElementById('auctionCurrentItemImage');
    this.currentBidInfo = document.getElementById('auctionCurrentBidInfo');
    this.currentBidValue = document.getElementById('auctionCurrentBidValue');
    this.currentBidTeam = document.getElementById('auctionCurrentBidTeam');
    this.timeCountDisplay = document.getElementById('auctionTimeCount');
    this.noItemMessage = document.getElementById('auctionNoItemMessage');

    this.teamListContainer = document.getElementById('teamListContainer');
    this.participantGrid = document.getElementById('participantGrid');

    this.auctionPageMasterControls = document.getElementById('auctionPageMasterControls');
    this.auctionPageMasterMessage = document.getElementById('auctionPageMasterMessage');
  }

  render(users, teams, items, auctionState) {
    this.renderTeamList(teams, users);
    this.renderParticipants(users, items, auctionState, teams);
    const currentItem =
      auctionState.currentAuctionItemIndex !== -1 ? items[auctionState.currentAuctionItemIndex] : null;
    this.renderCurrentItem(currentItem, auctionState, users, teams);
    this.updateAuctionControls(auctionState, items, teams);
  }

  renderCurrentItem(item, auctionState, users, teams) {
    if (!item) {
      this.noItemMessage.style.display = 'block';
      this.currentItemImage.style.display = 'none';
      this.currentBidInfo.style.display = 'none';
      this.currentItemName.textContent = '경매 대기 중';
      this.currentItemDescription.textContent = auctionState.isAuctionRunning
        ? '다음 매물을 기다리는 중...'
        : '마스터가 경매를 시작합니다.';
      return;
    }

    const displayName = item.participantId
      ? users.find((u) => u.id === item.participantId)?.username || '참여자'
      : item.name;
    this.noItemMessage.style.display = 'none';
    this.currentItemImage.src = item.image || '';
    this.currentItemImage.style.display = 'block';
    this.currentItemName.textContent = `매물: ${displayName}`;
    this.currentItemDescription.textContent = item.description || '설명 없음';
    this.currentBidInfo.style.display = 'flex';
    this.updateBidInfo(auctionState, teams);
  }

  updateBidInfo(auctionState, teams) {
    const team = teams.find((t) => t.id === auctionState.currentBidderTeamId);
    this.currentBidValue.textContent = auctionState.currentBid.toLocaleString();
    this.currentBidTeam.textContent = team ? team.name : '없음';
  }

  renderTeamList(teams, users) {
    this.teamListContainer.innerHTML = '';
    this.teamListContainer.classList.add('team-list-grid');

    teams.forEach((team) => {
      const leader = users.find((u) => u.id === team.leaderId);
      const div = document.createElement('div');
      div.classList.add('team-item');
      div.innerHTML = `
        <div class="team-avatar" style="background-image: url(https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(
          team.name
        )})"></div>
        <div class="team-info">
          <div class="team-name">${team.name}</div>
          <div class="team-points">리더: ${leader ? leader.username : '없음'}</div>
          <div class="team-points">포인트: ${team.points.toLocaleString()}P</div>
        </div>
        <div class="team-slots">
          ${Array(5)
            .fill('')
            .map((_, i) => `<div class="slot-indicator ${team.itemsWon.length > i ? 'filled' : ''}"></div>`)
            .join('')}
        </div>
      `;
      this.teamListContainer.appendChild(div);
    });
  }

  renderParticipants(users, items, auctionState, teams) {
    this.participantGrid.innerHTML = '';
    this.participantGrid.classList.add('participant-grid');

    const participants = users.filter((u) => u.role === 'teamLeader' || (u.role === 'general' && !u.teamId));

    participants.forEach((user) => {
      const div = document.createElement('div');
      div.classList.add('participant-avatar');
      const currentItem = items[auctionState.currentAuctionItemIndex];

      if (user.role === 'teamLeader') {
        div.classList.add('border-team-leader');
        if (auctionState.currentBidderTeamId === teams.find((t) => t.leaderId === user.id)?.id) {
          div.classList.add('active-bidder');
        }
      } else if (currentItem && currentItem.participantId === user.id) {
        div.classList.add('border-auction-item');
      } else {
        div.classList.add('border-general');
      }

      div.title = user.username;
      div.style.backgroundImage = `url(https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(
        user.username
      )})`;
      this.participantGrid.appendChild(div);
    });
  }

  updateTimer(seconds) {
    this.timeCountDisplay.textContent = `남은 시간: ${String(seconds).padStart(2, '0')}초`;
    this.timeCountDisplay.classList.add('time-count');
  }

  updateAuctionControls(auctionState, items, teams) {
    const isEnded = items.every((i) => i.isSold) || teams.every((t) => t.itemsWon.length >= 5);
    const canStart = !auctionState.isAuctionRunning || isEnded;
    const canStop = auctionState.isAuctionRunning;
    const canNext = auctionState.isAuctionRunning && auctionState.isAuctionPaused && !isEnded;

    document.getElementById('auctionPageStartAuctionBtn').disabled = !canStart;
    document.getElementById('auctionPageStopAuctionBtn').disabled = !canStop;
    document.getElementById('auctionPageNextAuctionBtn').disabled = !canNext;

    this.auctionPageMasterControls.style.display =
      this.currentUser && this.currentUser.role === 'master' ? 'flex' : 'none';

    ['auctionPageStartAuctionBtn', 'auctionPageStopAuctionBtn', 'auctionPageNextAuctionBtn'].forEach((id) => {
      document.getElementById(id).classList.add('control-btn');
    });
    document.getElementById('auctionPageStartAuctionBtn').classList.add('green');
    document.getElementById('auctionPageStopAuctionBtn').classList.add('red');
    document.getElementById('auctionPageNextAuctionBtn').classList.add('blue');
  }

  showMessage(msg, type = 'green') {
    this.auctionPageMasterMessage.textContent = msg;
    this.auctionPageMasterMessage.className = `message ${type}`;
  }
}
