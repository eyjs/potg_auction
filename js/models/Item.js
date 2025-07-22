export class Item {
  constructor({
    id,
    name,
    description = '',
    image = '',
    bidPrice = 0,
    bidderTeamId = null,
    isSold = false,
    participantId = null,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.image = image;
    this.bidPrice = bidPrice; // 최종 낙찰가
    this.bidderTeamId = bidderTeamId; // 낙찰 팀 ID
    this.isSold = isSold; // 판매 여부
    this.participantId = participantId; // 참가자 ID (매물 = 사람일 때)
  }

  markSold(teamId, price) {
    this.isSold = true;
    this.bidderTeamId = teamId;
    this.bidPrice = price;
  }

  reset() {
    this.isSold = false;
    this.bidderTeamId = null;
    this.bidPrice = 0;
  }
}
