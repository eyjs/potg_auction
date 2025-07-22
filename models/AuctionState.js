export class AuctionState {
  constructor({
    currentAuctionItemIndex = -1,
    timer = 30,
    intervalId = null,
    currentBid = 0,
    currentBidderTeamId = null,
    isAuctionRunning = false,
    isAuctionPaused = true,
    currentAuctionStartTime = 0,
  } = {}) {
    this.currentAuctionItemIndex = currentAuctionItemIndex;
    this.timer = timer;
    this.intervalId = intervalId;
    this.currentBid = currentBid;
    this.currentBidderTeamId = currentBidderTeamId;
    this.isAuctionRunning = isAuctionRunning;
    this.isAuctionPaused = isAuctionPaused;
    this.currentAuctionStartTime = currentAuctionStartTime;
  }

  reset() {
    this.currentAuctionItemIndex = -1;
    this.timer = 0;
    this.intervalId = null;
    this.currentBid = 0;
    this.currentBidderTeamId = null;
    this.isAuctionRunning = false;
    this.isAuctionPaused = true;
    this.currentAuctionStartTime = 0;
  }

  startRound(itemIndex, duration = 10) {
    this.currentAuctionItemIndex = itemIndex;
    this.timer = duration;
    this.isAuctionPaused = false;
    this.currentBid = 0;
    this.currentBidderTeamId = null;
    this.currentAuctionStartTime = Date.now();
  }

  pause() {
    this.isAuctionPaused = true;
  }

  resume() {
    this.isAuctionPaused = false;
  }
}
