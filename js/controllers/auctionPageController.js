import * as dom from '../../domRefs.js';
import { showTeamInfoModal, showCustomAlert, showPage } from '../views/sharedView.js';
import { bus } from '../core/bus.js';
import { populateUnbidItemsList, populateUnbidItemsTeamsList } from '../views/auctionPageView.js';

function setupAuctionDragAndDrop() {
  dom.unbidItemAssignmentAuctionPage.addEventListener('dragstart', (e) => {
    if (e.target.matches('.draggable-item')) {
      e.dataTransfer.setData('text/plain', e.target.dataset.userId);
    }
  });

  dom.unbidItemsTeamsListAuctionPage.addEventListener('dragover', (e) => {
    e.preventDefault();
    const target = e.target.closest('.dnd-team-item');
    if (target) target.classList.add('drag-over');
  });

  dom.unbidItemsTeamsListAuctionPage.addEventListener('dragleave', (e) => {
    const target = e.target.closest('.dnd-team-item');
    if (target) target.classList.remove('drag-over');
  });

  dom.unbidItemsTeamsListAuctionPage.addEventListener('drop', (e) => {
    e.preventDefault();
    const target = e.target.closest('.dnd-team-item');
    if (target) {
      target.classList.remove('drag-over');
      const teamId = target.dataset.teamId;
      const userId = e.dataTransfer.getData('text/plain');
      window.Store.actions.assignUnbidUserToTeam(userId, teamId);
    }
  });
}

export function initAuctionPageController() {
  dom.goToMasterPageBtn.addEventListener('click', () => showPage('masterPage'));
  setupAuctionDragAndDrop();

  dom.auctionPageStartAuctionBtn.addEventListener('click', () => window.Store.actions.startAuction());
  dom.auctionPageNextAuctionBtn.addEventListener('click', () => window.Store.actions.nextAuction());
  dom.auctionPageEndAuctionBtn.addEventListener('click', () => window.Store.actions.endAuction());
  dom.addTimeBtnAuctionPage.addEventListener('click', () => window.Store.actions.addTime(10));

  dom.teamListContainer.addEventListener('click', (e) => {
    const masterBidBtn = e.target.closest('.master-bid-btn');
    if (masterBidBtn) {
      const teamId = masterBidBtn.dataset.teamId;
      const amount = parseInt(masterBidBtn.dataset.amount, 10);
      const result = window.Store.actions.masterBid(teamId, amount);
      if (!result.success) {
        showCustomAlert(result.message, '입찰 실패');
      }
      return;
    }

    const teamItem = e.target.closest('.team-item');
    if (teamItem) {
      showTeamInfoModal(teamItem.dataset.teamId);
    }
  });

  dom.modalTeamMembers.addEventListener('click', (e) => {
    if (e.target.matches('.kick-btn')) {
      const userId = e.target.dataset.userId;
      const teamId = e.target.dataset.teamId;
      if (confirm('해당 인원을 팀에서 제거하시겠습니까?')) {
        window.Store.actions.removeMemberFromTeam(userId, teamId);
        dom.teamInfoModal.style.display = 'none';
      }
    }
  });

  if (dom.modalCloseBtn) dom.modalCloseBtn.addEventListener('click', () => (dom.teamInfoModal.style.display = 'none'));
  if (dom.teamInfoModal)
    dom.teamInfoModal.addEventListener('click', (e) => {
      if (e.target === dom.teamInfoModal) dom.teamInfoModal.style.display = 'none';
    });

  dom.printResultsBtn.addEventListener('click', () => {
    window.print();
  });

  dom.downloadJsonDataBtn.addEventListener('click', () => {
    const data = window.Store.getState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `auction-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  dom.restartAuctionBtn.addEventListener('click', () => {
    if (confirm('경매를 재시작하시겠습니까? 모든 데이터가 초기화됩니다.')) {
      window.Store.actions.startAuction();
    }
  });

  // Add bus listener for custom alerts
  bus.on('show:alert', ({ message, title }) => {
    showCustomAlert(message, title);
  });
}
