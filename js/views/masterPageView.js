import * as dom from '../../domRefs.js';

function updateTeamListMasterPage() {
    const { teams, users } = window.Store.getState();
    dom.createdTeamsList.innerHTML = '';
    teams.forEach((team) => {
        const leader = users.find((u) => u.id === team.leaderId);
        const li = document.createElement('li');
        
        let buttonsHTML = `<button class="delete" data-team-id="${team.id}" data-action="delete-team">삭제</button>`;
        if (leader) {
            buttonsHTML += ` <button class="release secondary-btn" data-team-id="${team.id}" data-action="release-leader">해제</button>`;
        }

        li.innerHTML = `
            <span>${team.name} (팀장: ${leader ? leader.username : '없음'})</span>
            <div class="team-buttons">${buttonsHTML}</div>
        `;
        dom.createdTeamsList.appendChild(li);
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
    populateAvailableUsersList();
    populateDndTeamsList();
}

export function renderMasterPage() {
    updateMasterPageLists();
    loadSettings();
}