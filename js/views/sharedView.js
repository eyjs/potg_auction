import * as dom from '../../domRefs.js';
import { renderAuctionPage } from './auctionPageView.js';
import { renderMasterPage } from './masterPageView.js';

export function showPage(pageId) {
  document.querySelectorAll('.page-container').forEach((page) => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
  document.body.classList.toggle('login-page', pageId === 'loginPage');

  // Body classes for auction state should only be applied on the auction page
  if (pageId === 'auctionPage') {
    const { auctionState } = window.Store.getState();
    document.body.classList.toggle('auction-running', auctionState.isAuctionRunning);
    document.body.classList.toggle('auction-ended', !auctionState.isAuctionRunning && auctionState.isEnded);
  } else {
    document.body.classList.remove('auction-running', 'auction-ended');
  }

  const { currentUser } = window.Store.getState();
  if (pageId === 'auctionPage') {
    dom.auctionUsernameDisplay.textContent = currentUser ? currentUser.username : '게스트';
    dom.goToMasterPageBtn.style.display = currentUser && currentUser.role === 'master' ? 'inline-block' : 'none';
    renderAuctionPage();
  } else if (pageId === 'masterPage') {
    dom.masterUsernameDisplay.textContent = currentUser ? currentUser.username : '게스트';
    renderMasterPage();
  }
}

export function showCustomAlert(message, title) {
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

export function showTeamInfoModal(teamId) {
    const { users, teams, items } = window.Store.getState();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    dom.modalTeamName.textContent = `${team.name} 팀원 정보`;
    const members = users
        .filter((u) => u.teamId === teamId)
        .sort((a, b) => (b.role === 'teamLeader') - (a.role === 'teamLeader'));

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
            const isLeader = member.role === 'teamLeader';
            const roleText = member.role === 'teamLeader' ? '팀장' : '팀원';
            const userImage = member.image || `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(member.username || 'default')}`;
            const tooltipText = `이미지 URL: ${userImage}\n아이디: ${member.username}\n낙찰가격: ${price.toLocaleString()}P`;

            tableHTML += `<tr title="${tooltipText}">
                            <td><img src="${userImage}" alt="${member.username}"></td>
                            <td>${member.username}</td>
                            <td>${roleText}</td>
                            <td style="white-space:nowrap;">
                              ${price.toLocaleString()} P
                              ${
                                !isLeader
                                  ? `<button class="kick-btn" data-user-id="${member.id}" data-team-id="${team.id}" title="팀에서 제거">×</button>`
                                  : ''
                              }
                            </td>
                         </tr>`;
        });
    }

    tableHTML += `</tbody></table>`;
    dom.modalTeamMembers.innerHTML = tableHTML;
    dom.teamInfoModal.style.display = 'flex';
}
