import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Item } from '../models/Item.js';
import { AuctionState } from '../models/AuctionState.js';
import { AuctionService } from '../services/AuctionService.js';
import { TeamService } from '../services/TeamService.js';
import { UserService } from '../services/UserService.js';
import { StorageService } from '../services/StorageService.js';
import { MasterView } from '../views/MasterView.js';

export class MasterController {
  constructor() {
    // 저장된 데이터 불러와서 모델로 변환
    this.users = StorageService.load('users').map((u) => new User(u));
    this.teams = StorageService.load('teams').map((t) => new Team(t));
    this.items = StorageService.load('items').map((i) => new Item(i));
    this.auctionState = new AuctionState(StorageService.load('auctionState') || {});

    // 서비스 초기화
    this.auctionService = new AuctionService(this.users, this.teams, this.items, this.auctionState);
    this.teamService = new TeamService(this.users, this.teams);
    this.userService = new UserService(this.users);

    // 뷰 초기화
    this.view = new MasterView();
    this.view.render(this.users, this.teams, this.items);
    this.view.updateAuctionControls(this.auctionState, this.items, this.teams);

    // 이벤트 바인딩
    this.bindEvents();

    // 스토리지 변경 시 동기화 (다른 탭과 동기화)
    window.addEventListener('storage', (event) => {
      if (['users', 'teams', 'items', 'auctionState'].includes(event.key)) {
        this.reloadData();
      }
    });
  }

  bindEvents() {
    // 유저 등록 버튼
    document.getElementById('registerUserBtn').addEventListener('click', () => {
      const username = document.getElementById('regUsername').value.trim();
      const password = document.getElementById('regPassword').value.trim();
      const result = this.userService.register(username, password);
      this.view.showMessage(result.message, result.success ? 'green' : 'red');
      if (result.success) {
        this.users = this.userService.getAll();
        this.view.render(this.users, this.teams, this.items);
      }
    });

    // 팀 생성 버튼
    document.getElementById('createTeamBtn').addEventListener('click', () => {
      const teamName = document.getElementById('teamNameInput').value.trim();
      const result = this.teamService.createTeam(teamName);
      this.view.showMessage(result.message, result.success ? 'green' : 'red');
      if (result.success) {
        this.teams = this.teamService.getAll();
        this.view.render(this.users, this.teams, this.items);
      }
    });

    // 경매 시작
    document.getElementById('masterStartAuctionBtn').addEventListener('click', () => {
      this.auctionService.startAuction();
      this.view.showMessage('경매가 준비되었습니다. "다음 매물"을 클릭하세요.', 'green');
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });

    // 경매 중지
    document.getElementById('masterStopAuctionBtn').addEventListener('click', () => {
      this.auctionService.stopAuction();
      this.view.showMessage('경매가 중지되었습니다.', 'orange');
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });

    // 다음 매물 경매
    document.getElementById('masterNextAuctionBtn').addEventListener('click', () => {
      const nextItem = this.auctionService.nextItem();
      if (nextItem) {
        this.view.renderCurrentItem(nextItem, this.auctionState, this.users);
      } else {
        this.view.showMessage('모든 매물이 낙찰되었습니다.', 'blue');
      }
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });

    // 등록된 아이템 삭제 (동적 이벤트 위임)
    this.view.registeredItemsList.addEventListener('click', (e) => {
      if (e.target.matches('.delete')) {
        const itemId = e.target.dataset.itemId;
        this.deleteItem(itemId);
      }
    });

    // 팀장 해제 (동적 이벤트 위임)
    this.view.currentTeamLeadersList.addEventListener('click', (e) => {
      if (e.target.matches('.delete')) {
        const teamId = e.target.dataset.teamId;
        this.removeTeamLeader(teamId);
      }
    });
  }

  deleteItem(itemId) {
    const index = this.items.findIndex((i) => i.id === itemId);
    if (index === -1) return;
    const item = this.items[index];

    // 경매 중인 아이템은 삭제 불가
    if (
      this.auctionState.currentAuctionItemIndex !== -1 &&
      this.items[this.auctionState.currentAuctionItemIndex].id === itemId
    ) {
      this.view.showMessage('현재 경매 중인 매물은 삭제할 수 없습니다.', 'red');
      return;
    }

    // 참가자 아이템 팀 소속 시 삭제 불가
    if (item.participantId) {
      const user = this.users.find((u) => u.id === item.participantId);
      if (user && (user.role === 'teamLeader' || user.teamId)) {
        this.view.showMessage('팀에 속한 참여자는 삭제할 수 없습니다.', 'red');
        return;
      }
    }

    this.items.splice(index, 1);
    this.teams.forEach((t) => {
      t.itemsWon = t.itemsWon.filter((id) => id !== itemId);
    });
    StorageService.save('items', this.items);
    this.view.showMessage('매물이 삭제되었습니다.', 'green');
    this.view.render(this.users, this.teams, this.items);
  }

  removeTeamLeader(teamId) {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team || !team.leaderId) return;
    const leader = this.users.find((u) => u.id === team.leaderId);
    if (leader) {
      leader.role = 'general';
      leader.teamId = null;
    }
    team.leaderId = null;
    StorageService.save('users', this.users);
    StorageService.save('teams', this.teams);
    this.view.render(this.users, this.teams, this.items);
  }

  reloadData() {
    this.users = StorageService.load('users').map((u) => new User(u));
    this.teams = StorageService.load('teams').map((t) => new Team(t));
    this.items = StorageService.load('items').map((i) => new Item(i));
    this.auctionState = new AuctionState(StorageService.load('auctionState') || {});
    this.view.render(this.users, this.teams, this.items);
    this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
  }
}
