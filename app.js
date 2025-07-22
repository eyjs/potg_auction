import { User } from './models/User.js';
import { Team } from './models/Team.js';
import { Item } from './models/Item.js';
import { AuctionState } from './models/AuctionState.js';
import { AuctionService } from './services/AuctionService.js';
import { TeamService } from './services/TeamService.js';
import { UserService } from './services/UserService.js';
import { MasterView } from './views/MasterView.js';
import { StorageService } from './services/StorageService.js';

class MasterController {
  constructor() {
    // 데이터 로드 (모델 객체로 변환)
    this.users = StorageService.load('users').map((u) => new User(u));
    this.teams = StorageService.load('teams').map((t) => new Team(t));
    this.items = StorageService.load('items').map((i) => new Item(i));
    this.auctionState = new AuctionState(StorageService.load('auctionState') || {});

    // 서비스 초기화
    this.auctionService = new AuctionService(this.users, this.teams, this.items, this.auctionState);
    this.teamService = new TeamService(this.users, this.teams);
    this.userService = new UserService(this.users);

    // View
    this.view = new MasterView();

    // 초기 렌더링
    this.view.render(this.users, this.teams, this.items);
    this.view.updateAuctionControls(this.auctionState, this.items, this.teams);

    // 이벤트 바인딩
    this.bindEvents();
  }

  bindEvents() {
    // 경매 제어 버튼
    document.getElementById('masterStartAuctionBtn').addEventListener('click', () => {
      this.auctionService.startAuction();
      this.view.showMessage('경매가 준비되었습니다. "다음 매물"을 클릭하세요.', 'green');
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });

    document.getElementById('masterStopAuctionBtn').addEventListener('click', () => {
      this.auctionService.stopAuction();
      this.view.showMessage('경매가 중지되었습니다.', 'orange');
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });

    document.getElementById('masterNextAuctionBtn').addEventListener('click', () => {
      const nextItem = this.auctionService.nextItem();
      if (nextItem) {
        this.view.renderCurrentItem(nextItem, this.auctionState, this.users);
      } else {
        this.view.showMessage('모든 매물이 낙찰되었습니다.', 'blue');
      }
      this.view.updateAuctionControls(this.auctionState, this.items, this.teams);
    });

    // 유저 등록
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

    // 팀 생성
    document.getElementById('createTeamBtn').addEventListener('click', () => {
      const teamName = document.getElementById('teamNameInput').value.trim();
      const result = this.teamService.createTeam(teamName);
      this.view.showMessage(result.message, result.success ? 'green' : 'red');
      if (result.success) {
        this.teams = this.teamService.getAll();
        this.view.render(this.users, this.teams, this.items);
      }
    });
  }
}

// 초기 실행
document.addEventListener('DOMContentLoaded', () => {
  new MasterController();
});
