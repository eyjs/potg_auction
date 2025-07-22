export class Team {
  constructor({ id, name, leaderId = null, points = 0, tempPoints = 0, itemsWon = [] }) {
    this.id = id;
    this.name = name;
    this.leaderId = leaderId; // 팀장 User ID
    this.points = points; // 남은 포인트
    this.tempPoints = tempPoints; // 임시 포인트 (경매 중에만 사용)
    this.itemsWon = itemsWon; // 경매에서 낙찰된 아이템 ID 배열
  }

  hasLeader() {
    return !!this.leaderId;
  }

  canBid() {
    return this.itemsWon.length < 4; // 최대 4개 아이템
  }

  assignLeader(userId) {
    this.leaderId = userId;
  }

  addItem(itemId, cost) {
    this.itemsWon.push(itemId);
    this.points -= cost;
  }
}
