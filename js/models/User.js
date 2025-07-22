export class User {
  constructor({ id, username, password, role = 'general', teamId = null, points = 0 }) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.role = role; // 'master', 'teamLeader', 'general'
    this.teamId = teamId; // 속한 팀 ID (없으면 null)
    this.points = points; // 보유 포인트
  }

  isMaster() {
    return this.role === 'master';
  }

  isTeamLeader() {
    return this.role === 'teamLeader';
  }

  isGeneral() {
    return this.role === 'general';
  }
}
