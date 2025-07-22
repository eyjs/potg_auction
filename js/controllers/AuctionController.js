import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Item } from '../models/Item.js';
import { AuctionState } from '../models/AuctionState.js';
import { AuctionService } from '../services/AuctionService.js';
import { StorageService } from '../services/StorageService.js';
import { AuctionView } from '../views/AuctionView.js';

export class AuctionController {
  constructor(currentUser) {
    // 세션의 현재 사용자 (teamLeader/general/master)
    this.currentUser = currentUser;

    // 데이터 불러오기
    this.users = StorageService.load('users').map((u) => new User(u));
    this.teams = StorageService.load('teams').map((t) => new Team(t));
    this.items = StorageService.load('items').map((i) => new Item(i));
    this.auctionState = new AuctionState(StorageService.load('auctionState') || {});

    // 서비스와 뷰 초기화
    this.auctionService = new AuctionService(this.users, this.teams, this.items, this.auctionState);
    this.view = new AuctionView(currentUser);

    // 초기 렌더링
    this.view.render(this.users, this.teams, this.items, this.auctionState);

    // 이벤트 바인딩
    this.bindEvents();

    // 실시간 동기화 (스토리지 변경 감지)
    window.addEventListener('storage', (event) => {
      if (['users', 'teams', 'items', 'auctionState'].includes(event.key)) {
        this.reloadData();
      }
    });

    // 타이머 시작 (마스터 화면과 동기화)
    this.startTimerSync();
  }

  bindEvents() {
    // Master 전용 경매 제어 버튼 (Auction 페이지에서도 Master가 조작 가능)
    document.getElementById('auctionPageStartAuctionBtn').addEventListener('click', () => {
      if (!this.isMaster()) return;
      this.auctionService.startAuction();
      this.view.showMessage('경매 준비 완료', 'green');
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });

    document.getElementById('auctionPageStopAuctionBtn').addEventListener('click', () => {
      if (!this.isMaster()) return;
      this.auctionService.stopAuction();
      this.view.showMessage('경매 중지', 'orange');
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });

    document.getElementById('auctionPageNextAuctionBtn').addEventListener('click', () => {
      if (!this.isMaster()) return;
      const nextItem = this.auctionService.nextItem();
      if (nextItem) {
        this.view.renderCurrentItem(nextItem, this.auctionState, this.users);
      } else {
        this.view.showMessage('모든 매물 낙찰 완료', 'blue');
      }
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });
  }

  startTimerSync() {
    if (this.auctionState.intervalId) clearInterval(this.auctionState.intervalId);
    this.auctionState.intervalId = setInterval(() => {
      this.auctionState.timer = Math.max(0, this.auctionState.timer - 1);
      this.view.updateTimer(this.auctionState.timer);
      if (this.auctionState.timer <= 0) {
        clearInterval(this.auctionState.intervalId);
        if (this.isMaster()) {
          this.auctionService.endRound();
          this.view.render(this.users, this.teams, this.items, this.auctionState);
          this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
        }
      }
    }, 1000);
  }

  reloadData() {
    this.users = StorageService.load('users').map((u) => new User(u));
    this.teams = StorageService.load('teams').map((t) => new Team(t));
    this.items = StorageService.load('items').map((i) => new Item(i));
    this.auctionState = new AuctionState(StorageService.load('auctionState') || {});
    this.view.render(this.users, this.teams, this.items, this.auctionState);
    this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
  }

  isMaster() {
    return this.currentUser && this.currentUser.role === 'master';
  }
}
