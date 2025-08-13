import * as dom from '../../domRefs.js';

function updateTeamListMasterPage() {
    const { teams, users } = window.Store.getState();
    dom.createdTeamsList.innerHTML = '';
    teams.forEach((team) => {
        const leader = users.find((u) => u.id === team.leaderId);
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${team.name} (팀장: ${leader ? leader.username : '없음'})</span>
            <button class="delete" data-team-id="${team.id}">삭제</button>
        `;
        dom.createdTeamsList.appendChild(li);
    });

    dom.currentTeamLeadersList.innerHTML = '';
    teams.filter(t => t.leaderId).forEach(team => {
        const leader = users.find(u => u.id === team.leaderId);
        if(leader) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${team.name} - ${leader.username}</span><button class="delete" data-team-id="${team.id}" data-action="remove-leader">해제</button></li>`;
            dom.currentTeamLeadersList.appendChild(li);
        }
    });
}

function updateRegisteredItemsList() {
    const { items, users, teams } = window.Store.getState();
    dom.registeredItemsList.innerHTML = '';
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
        const li = document.createElement('li');
        li.innerHTML = `<span>${displayName} ${statusText}</span><button class="delete" data-item-id="${item.id}">삭제</button></li>`;
        dom.registeredItemsList.appendChild(li);
    });
}

function populateAvailableUsersList() {
    const { users } = window.Store.getState();
    dom.availableUsersList.innerHTML = '';
    users
        .filter((u) => u.role === 'general' && u.teamId === null)
        .forEach((user) => {
            const li = document.createElement('li');
            li.className = 'draggable-user';
            li.draggable = true;
            li.dataset.userId = user.id;
            li.textContent = user.username;
            dom.availableUsersList.appendChild(li);
        });
}

function populateDndTeamsList() {
    const { teams, users } = window.Store.getState();
    dom.dndTeamsList.innerHTML = '';
    teams.forEach((team) => {
        const li = document.createElement('li');
        li.className = 'dnd-team-item';
        li.dataset.teamId = team.id;
        const leader = users.find((u) => u.id === team.leaderId);
        li.innerHTML = `<span><strong>${team.name}</strong></span><span>팀장: ${leader ? leader.username : '없음'}</span>`;
        dom.dndTeamsList.appendChild(li);
    });
}

function loadSettings() {
    const { auctionState } = window.Store.getState();
    dom.auctionDurationInput.value = auctionState.auctionDuration || 30;
    dom.bidExtraTimeInput.value = auctionState.bidExtraTime || 10;
}

function updateMasterPageLists() {
    updateTeamListMasterPage();
    updateRegisteredItemsList();
    populateAvailableUsersList();
    populateDndTeamsList();
}

export function renderMasterPage() {
    const { currentUser } = window.Store.getState();
    if (!currentUser || currentUser.role !== 'master') return;
    dom.masterUsernameDisplay.textContent = currentUser.username;
    updateMasterPageLists();
    loadSettings();
}
