import * as dom from '../../domRefs.js';

const MAX_TEAM_ITEMS = 4;

function getUserImageUrl(user) {
    return user?.image || `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(user?.username || 'default')}`;
}

function getItemImageUrl(item) {
    const { users } = window.Store.getState();
    if (item?.image) return item.image;
    if (item?.participantId) {
        const user = users.find((u) => u.id === item.participantId);
        if (user) return getUserImageUrl(user);
    }
    return `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(item?.name || 'default')}`;
}

function updateBidInfo() {
    const { teams, auctionState } = window.Store.getState();
    const team = teams.find((t) => t.id === auctionState.currentBidderTeamId);
    dom.currentBidValue.textContent = auctionState.currentBid.toLocaleString();
    dom.currentBidTeam.textContent = team ? team.name : '없음';
    dom.timeCountDisplay.textContent = `남은 시간: ${String(auctionState.timer).padStart(2, '0')}초`;
}

function updateAuctionDisplay(item) {
    const { auctionState } = window.Store.getState();
    dom.auctionPageMasterControls.style.display = 'flex';

    if (item && auctionState.isAuctionRunning && !auctionState.isAuctionPaused) {
        dom.noItemMessage.style.display = 'none';
        dom.currentItemImage.src = getItemImageUrl(item);
        dom.currentItemImage.style.display = 'block';
        const displayName = item.participantId
            ? window.Store.getState().users.find((u) => u.id === item.participantId)?.username || '참여자'
            : item.name;
        dom.currentItemName.textContent = `매물: ${displayName}`;
        dom.currentItemDescription.textContent = item.description || '설명 없음';
        dom.currentBidInfo.style.display = 'flex';
        updateBidInfo();
    } else {
        dom.noItemMessage.style.display = 'block';
        dom.currentItemImage.style.display = 'none';
        dom.currentBidInfo.style.display = 'none';
        dom.currentItemName.textContent = '경매 대기 중';
        dom.currentItemDescription.textContent = window.Store.getState().auctionState.isEnded
            ? '경매가 모두 종료되었습니다.'
            : '마스터가 경매를 시작합니다.';
    }
}

function renderTeamList() {
    const { teams, users, auctionState } = window.Store.getState();
    dom.teamListContainer.innerHTML = '';
    teams.forEach((team) => {
        const teamLeader = users.find((u) => u.id === team.leaderId);
        const teamItem = document.createElement('div');
        teamItem.classList.add('team-item');
        teamItem.dataset.teamId = team.id;
        const teamAvatarSrc = `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(team.name)}`;

        let masterBidButtonsHTML = '';
        if (auctionState.isAuctionRunning && !auctionState.isAuctionPaused) {
            const bidIncrements = [100, 200, 500, 1000];
            masterBidButtonsHTML = `<div class="master-bid-btn-group">${bidIncrements
                .map((amount) => `<button class="master-bid-btn" data-team-id="${team.id}" data-amount="${amount}">+${amount}</button>`)
                .join('')}</div>`;
        }

        teamItem.innerHTML = `
          <div class="team-avatar" style="background-image: url(${teamAvatarSrc});"></div>
          <div class="team-info">
              <div class="team-name">${team.name}</div>
              <div class="team-points">리더: ${teamLeader ? teamLeader.username : '없음'}</div>
              <div class="team-points">포인트: ${team.points.toLocaleString()}P</div>
          </div>
          <div class="team-slots">${Array(MAX_TEAM_ITEMS)
            .fill()
            .map((_, i) => `<div class="slot-indicator ${team.itemsWon.length > i ? 'filled' : ''}"></div>`)
            .join('')}</div>
          ${masterBidButtonsHTML}
        `;
        dom.teamListContainer.appendChild(teamItem);
    });
}

function renderParticipantGrid() {
    const { users, items, auctionState } = window.Store.getState();
    dom.participantGrid.innerHTML = '';
    const participants = users.filter((u) => u.role === 'general' && items.some((i) => i.participantId === u.id));

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

        dom.participantGrid.appendChild(container);
    });
}

function highlightCurrentBidder() {
    const { auctionState } = window.Store.getState();
    document.querySelectorAll('.team-item').forEach((card) => {
        card.classList.remove('highlight');
    });
    if (auctionState.currentBidderTeamId) {
        const targetCard = document.querySelector(`.team-item[data-team-id="${auctionState.currentBidderTeamId}"]`);
        if (targetCard) {
            targetCard.classList.add('highlight');
        }
    }
}

function updateAuctionControls() {
    const { items, teams, auctionState } = window.Store.getState();
    const isEnded = (items.length > 0 && items.every((item) => item.status !== 'pending')) || teams.every((team) => team.itemsWon.length >= MAX_TEAM_ITEMS);
    const canStart = !auctionState.isAuctionRunning || isEnded;
    const canStop = auctionState.isAuctionRunning;
    const canNext = auctionState.isAuctionRunning && auctionState.isAuctionPaused && !isEnded;
    const canAddTime = auctionState.isAuctionRunning && !auctionState.isAuctionPaused;

    console.log({ isEnded, canStart, isAuctionRunning: auctionState.isAuctionRunning, isAuctionPaused: auctionState.isAuctionPaused });

    if (dom.auctionPageStartAuctionBtn) dom.auctionPageStartAuctionBtn.disabled = !canStart;
    if (dom.auctionPageStopAuctionBtn) dom.auctionPageStopAuctionBtn.disabled = !canStop;
    if (dom.auctionPageEndAuctionBtn) dom.auctionPageEndAuctionBtn.disabled = !canStop;
    if (dom.auctionPageNextAuctionBtn) dom.auctionPageNextAuctionBtn.disabled = !canNext;
    if (dom.addTimeBtnAuctionPage) dom.addTimeBtnAuctionPage.disabled = !canAddTime;
}

export function populateUnbidItemsList(listElement) {
    const { users } = window.Store.getState();
    listElement.innerHTML = '';
    users
        .filter((u) => u.role === 'general' && u.teamId === null)
        .forEach((user) => {
            const li = document.createElement('li');
            li.className = 'draggable-item';
            li.draggable = true;
            li.dataset.userId = user.id;
            li.innerHTML = `<img src="${getUserImageUrl(user)}" style="width:24px; height:24px; border-radius:50%; margin-right:8px;"> ${user.username}`;
            listElement.appendChild(li);
        });
}

export function populateUnbidItemsTeamsList(listElement) {
    const { teams } = window.Store.getState();
    listElement.innerHTML = '';
    teams.forEach((team) => {
        const li = document.createElement('li');
        li.className = 'dnd-team-item';
        li.dataset.teamId = team.id;
        li.innerHTML = `<strong>${team.name}</strong> <span>(${team.itemsWon.length}/${MAX_TEAM_ITEMS})</span>`;
        listElement.appendChild(li);
    });
}

function renderResultsTable() {
    const { users, teams, items } = window.Store.getState();
    let tableHTML = `
        <table class="results-table">
          <thead>
            <tr>
              <th>팀명</th>
              <th>남은 포인트</th>
              <th>팀원 (포인트 사용 내역)</th>
            </tr>
          </thead>
          <tbody>
      `;
    teams.forEach((team) => {
        const leader = users.find((u) => u.id === team.leaderId);
        const members = users.filter((u) => u.teamId === team.id);
        tableHTML += `
          <tr>
            <td>
              <strong>${team.name}</strong><br>
              <span class="team-leader-name">(리더: ${leader ? leader.username : '없음'})</span>
            </td>
            <td class="points-cell">
              ${team.points.toLocaleString()}P
            </td>
            <td>
              <ul class="members-list">
                ${members
                  .map((member) => {
                    const wonItem = items.find(
                      (item) => item.participantId === member.id && item.status === 'sold' && item.bidderTeamId === team.id
                    );
                    const price = wonItem && typeof wonItem.bidPrice === 'number' ? wonItem.bidPrice : 0;
                    const roleText =
                      member.role === 'teamLeader'
                        ? ` <span class="role-leader">(팀장)</span>`
                        : '';
                    return `<li>
                      <span>${member.username}${roleText}</span>
                      <span class="price-tag"> - ${price.toLocaleString()}P</span>
                    </li>`;
                  })
                  .join('')}
              </ul>
            </td>
          </tr>
        `;
    });
    tableHTML += `
          </tbody>
        </table>
      `;
    dom.resultsTableContainer.innerHTML = tableHTML;
}

export function renderAuctionPage() {
    const { items, auctionState } = window.Store.getState();

    if (!auctionState.isEnded) {
        // 경매 진행 중
        dom.auctionInProgressContainer.style.display = 'grid';
        dom.unbidAssignmentContainer.style.display = 'none';
        dom.auctionResultsContainer.style.display = 'none';

        const currentItem = auctionState.currentAuctionItemIndex !== -1 ? items[auctionState.currentAuctionItemIndex] : null;
        renderTeamList();
        renderParticipantGrid();
        updateAuctionDisplay(currentItem);
        updateAuctionControls();
        highlightCurrentBidder();
    } else {
        // 경매 종료
        dom.auctionInProgressContainer.style.display = 'none';
        
        if (auctionState.postAuctionView === 'unbid') {
            dom.unbidAssignmentContainer.style.display = 'block';
            dom.auctionResultsContainer.style.display = 'none';
            populateUnbidItemsList(dom.unbidItemsListAuctionPage);
            populateUnbidItemsTeamsList(dom.unbidItemsTeamsListAuctionPage);
        } else { // 'results' or 'none'
            dom.unbidAssignmentContainer.style.display = 'none';
            dom.auctionResultsContainer.style.display = 'block';
            renderResultsTable();
        }
    }
}
