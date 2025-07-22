import { StorageService } from './StorageService.js';

export class AuctionService {
  constructor(users, teams, items, auctionState) {
    this.users = users;
    this.teams = teams;
    this.items = items;
    this.auctionState = auctionState;
  }

  startAuction() {
    this.auctionState.isAuctionRunning = true;
    this.auctionState.isAuctionPaused = true;
    this.auctionState.currentAuctionItemIndex = -1;
    this.save();
  }

  stopAuction() {
    if (this.auctionState.intervalId) {
      clearInterval(this.auctionState.intervalId);
      this.auctionState.intervalId = null;
    }
    this.auctionState.isAuctionRunning = false;
    this.save();
  }

  nextItem() {
    const availableItems = this.items.filter((i) => !i.isSold);
    if (availableItems.length === 0) return null;

    let nextIndex = this.auctionState.currentAuctionItemIndex + 1;
    if (nextIndex >= this.items.length) nextIndex = 0;

    for (let i = 0; i < this.items.length; i++) {
      const index = (nextIndex + i) % this.items.length;
      if (!this.items[index].isSold) {
        this.auctionState.startRound(index, 10);
        this.save();
        return this.items[index];
      }
    }
    return null;
  }

  bid(teamId, amount) {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team || !team.canBid()) return false;

    const newBid = this.auctionState.currentBid + amount;
    if (team.points < newBid) return false;

    this.auctionState.currentBid = newBid;
    this.auctionState.currentBidderTeamId = teamId;
    if (this.auctionState.timer < 10) {
      this.auctionState.timer = 10;
    }
    this.save();
    return true;
  }

  endRound() {
    const currentItem = this.items[this.auctionState.currentAuctionItemIndex];
    const winningTeam = this.teams.find((t) => t.id === this.auctionState.currentBidderTeamId);

    if (currentItem && winningTeam) {
      winningTeam.addItem(currentItem.id, this.auctionState.currentBid);
      currentItem.markSold(winningTeam.id, this.auctionState.currentBid);

      if (currentItem.participantId) {
        const user = this.users.find((u) => u.id === currentItem.participantId);
        if (user) user.teamId = winningTeam.id;
      }
    }

    this.auctionState.pause();
    this.save();
  }

  save() {
    StorageService.save('users', this.users);
    StorageService.save('teams', this.teams);
    StorageService.save('items', this.items);
    StorageService.save('auctionState', this.auctionState);
  }
}
