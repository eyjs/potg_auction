export class MasterView {
  constructor() {
    // DOM 요소 캐싱 (중복 접근 방지)
    this.masterUsernameDisplay = document.getElementById('masterUsernameDisplay');
    this.createdTeamsList = document.getElementById('createdTeamsList');
    this.currentTeamLeadersList = document.getElementById('currentTeamLeadersList');
    this.registeredItemsList = document.getElementById('registeredItemsList');

    this.scaffoldMessage = document.getElementById('scaffoldMessage');
    this.auctionMasterMessage = document.getElementById('auctionMasterMessage');

    this.unbidItemAssignmentSection = document.getElementById('unbidItemAssignmentSection');
    this.unbidItemsListMasterPage = document.getElementById('unbidItemsListMasterPage');
    this.unbidItemsTeamsListMasterPage = document.getElementById('unbidItemsTeamsListMasterPage');

    this.currentItemName = document.getElementById('currentItemName');
    this.currentItemDescription = document.getElementById('currentItemDescription');
    this.currentItemImage = document.getElementById('currentItemImage');
    this.currentBidInfo = document.getElementById('currentBidInfo');
    this.currentBidValue = document.getElementById('currentBidValue');
    this.currentBidTeam = document.getElementById('currentBidTeam');
    this.noItemMessage = document.getElementById('noItemMessage');
  }

  /**
   * Master 페이지 렌더링 (유저, 팀, 아이템 리스트)
   */
  render(users, teams, items) {
    this.renderTeams(teams, users);
    this.renderItems(items, teams, users);
    this.renderTeamLeaders(teams, users);
  }

  /**
   * 팀 리스트 렌더링
   */
  renderTeams(teams, users) {
    this.createdTeamsList.innerHTML = '';
    teams.forEach((team) => {
      const leader = users.find((u) => u.id === team.leaderId);
      const li = document.createElement('li');
      li.textContent = `${team.name} (팀장: ${leader ? leader.username : '없음'})`;
      this.createdTeamsList.appendChild(li);
    });
  }

  /**
   * 팀장 리스트 렌더링
   */
  renderTeamLeaders(teams, users) {
    this.currentTeamLeadersList.innerHTML = '';
    teams
      .filter((t) => t.leaderId)
      .forEach((team) => {
        const leader = users.find((u) => u.id === team.leaderId);
        if (!leader) return;
        const li = document.createElement('li');
        li.innerHTML = `
        <span>${team.name} - ${leader.username}</span>
        <button class="delete" data-team-id="${team.id}">해제</button>
      `;
        this.currentTeamLeadersList.appendChild(li);
      });
  }

  /**
   * 등록된 아이템 리스트 렌더링
   */
  renderItems(items, teams, users) {
    this.registeredItemsList.innerHTML = '';
    items.forEach((item) => {
      const displayName = item.participantId
        ? users.find((u) => u.id === item.participantId)?.username || '알 수 없음'
        : item.name;

      const status = item.isSold
        ? `(판매 완료 - ${teams.find((t) => t.id === item.bidderTeamId)?.name || '팀 없음'})`
        : '(경매 대기)';

      const li = document.createElement('li');
      li.innerHTML = `
        <span>${displayName} ${status}</span>
        <button class="delete" data-item-id="${item.id}">삭제</button>
      `;
      this.registeredItemsList.appendChild(li);
    });
  }

  /**
   * 현재 경매 중인 아이템 정보 표시
   */
  renderCurrentItem(item, auctionState, users) {
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
      ? users.find((u) => u.id === item.participantId)?.username || '참여자'
      : item.name;
    this.currentItemName.textContent = `매물: ${displayName}`;
    this.currentItemDescription.textContent = item.description || '설명 없음';
    this.currentBidInfo.style.display = 'flex';
    this.updateBidInfo(auctionState, users);
  }

  /**
   * 입찰 상태 업데이트
   */
  updateBidInfo(auctionState, teams) {
    const team = teams.find((t) => t.id === auctionState.currentBidderTeamId);
    this.currentBidValue.textContent = auctionState.currentBid.toLocaleString();
    this.currentBidTeam.textContent = team ? team.name : '없음';
  }

  /**
   * 경매 컨트롤 버튼 상태 갱신
   */
  updateAuctionControls(auctionState, items, teams) {
    const isEnded = items.every((i) => i.isSold) || teams.every((t) => t.itemsWon.length >= 5);
    const canStart = !auctionState.isAuctionRunning || isEnded;
    const canStop = auctionState.isAuctionRunning;
    const canNext = auctionState.isAuctionRunning && auctionState.isAuctionPaused && !isEnded;

    document.getElementById('masterStartAuctionBtn').disabled = !canStart;
    document.getElementById('masterStopAuctionBtn').disabled = !canStop;
    document.getElementById('masterNextAuctionBtn').disabled = !canNext;

    if (isEnded && !auctionState.isAuctionRunning) {
      this.unbidItemAssignmentSection.style.display = 'flex';
    } else {
      this.unbidItemAssignmentSection.style.display = 'none';
    }
  }

  /**
   * 메시지 표시
   */
  showMessage(msg, type = 'green') {
    this.auctionMasterMessage.textContent = msg;
    this.auctionMasterMessage.className = type;
  }
}
