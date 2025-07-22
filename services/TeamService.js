import { Team } from '../models/Team.js';
import { StorageService } from './StorageService.js';

export class TeamService {
  constructor(users = [], teams = []) {
    this.users = users;
    this.teams = teams;
  }

  createTeam(name) {
    if (!name) {
      return { success: false, message: '팀 이름을 입력하세요.' };
    }
    if (this.teams.some((t) => t.name === name)) {
      return { success: false, message: '이미 존재하는 팀 이름입니다.' };
    }

    const newTeam = new Team({
      id: `team_${Date.now()}`,
      name,
      leaderId: null,
      points: 10000,
      itemsWon: [],
    });

    this.teams.push(newTeam);
    this.save();
    return { success: true, message: `팀 '${name}'이(가) 생성되었습니다.` };
  }

  getAll() {
    return this.teams;
  }

  save() {
    StorageService.save('teams', this.teams);
  }
}
