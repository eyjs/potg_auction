import { ls, ss } from '../core/storage.js';
import { bus } from '../core/bus.js';

// --- Constants ---
const USER_ROLE = {
  MASTER: 'master',
  TEAM_LEADER: 'teamLeader',
  GENERAL: 'general',
};
const MAX_TEAM_ITEMS = 4;

// --- Private Helper Functions ---
function getUserImageUrl(user) {
  return user?.image || `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(user?.username || 'default')}`;
}

function makeItemFromUser(user) {
  return {
    id: `item_${user.id}`,
    name: user.username,
    description: `참가자 ${user.username}`,
    image: getUserImageUrl(user),
    status: 'pending',
    participantId: user.id,
    bidPrice: 0,
    bidderTeamId: null,
  };
}

// --- Initial State ---
function initialState() {
  const users = ls.get('users', []);
  if (!users.some((u) => u.id === 'master' && u.role === USER_ROLE.MASTER)) {
    users.push({ id: 'master', username: 'master', password: 'master', role: USER_ROLE.MASTER, image: null });
  }
  return {
    users,
    teams: ls.get('teams', []),
    items: ls.get('items', []),
    auctionState: {
      currentAuctionItemIndex: -1,
      timer: 30,
      currentBid: 0,
      currentBidderTeamId: null,
      isAuctionRunning: false,
      isAuctionPaused: true,
      isEnded: false,
      postAuctionView: 'none', // 'none', 'unbid', or 'results'
      currentAuctionStartTime: 0,
      auctionDuration: 30,
      bidExtraTime: 10,
    },
    currentUser: ss.get('currentUser', null),
  };
}

let state = initialState();
let timerInterval = null;

// --- Persistence ---
function persist(partial) {
  if ('users' in partial) ls.set('users', state.users);
  if ('teams' in partial) ls.set('teams', state.teams);
  if ('items' in partial) ls.set('items', state.items);
  if ('auctionState' in partial) ls.set('auctionState', state.auctionState);
  if ('currentUser' in partial) ss.set('currentUser', state.currentUser);
}

// --- Public API ---
export const Store = {
  getState() {
    return JSON.parse(JSON.stringify(state));
  },

  setState(partial, options = {}) {
    const finalOptions = { emit: true, persist: true, ...options };
    state = { ...state, ...partial };
    if (finalOptions.persist) persist(partial);
    if (finalOptions.emit) bus.emit('state:changed', { changed: Object.keys(partial) });
  },

  actions: {
    // --- Auth ---
    login(username, password) {
      const user = state.users.find((u) => u.username === username && u.password === password);
      if (user) Store.setState({ currentUser: user });
      return user;
    },

    logout() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      Store.setState({ currentUser: null });
    },

    // --- Team & User ---
    removeMemberFromTeam(userId, teamId) {
        const teamIndex = state.teams.findIndex((t) => t.id === teamId);
        const userIndex = state.users.findIndex((u) => u.id === userId);
        if (teamIndex === -1 || userIndex === -1) return;

        const newTeams = [...state.teams];
        const newUsers = [...state.users];
        const newItems = [...state.items];

        const itemIndex = newItems.findIndex((i) => i.participantId === userId && i.status === 'sold' && i.bidderTeamId === teamId);
        if (itemIndex !== -1) {
            const item = newItems[itemIndex];
            newTeams[teamIndex] = { ...newTeams[teamIndex], points: newTeams[teamIndex].points + (item.bidPrice || 0) };
            newItems[itemIndex] = { ...item, status: 'pending', bidPrice: 0, bidderTeamId: null };
        }
        
        newTeams[teamIndex] = { ...newTeams[teamIndex], itemsWon: newTeams[teamIndex].itemsWon.filter(id => id !== (itemIndex !== -1 ? newItems[itemIndex].id : '')) };
        newUsers[userIndex] = { ...newUsers[userIndex], teamId: null };

        Store.setState({ users: newUsers, teams: newTeams, items: newItems });
    },

    assignUnbidUserToTeam(userId, teamId) {
        const userIndex = state.users.findIndex((u) => u.id === userId);
        const teamIndex = state.teams.findIndex((t) => t.id === teamId);
        if (userIndex === -1 || teamIndex === -1) return;

        const user = state.users[userIndex];
        const team = state.teams[teamIndex];
        if (user.teamId !== null || team.itemsWon.length >= MAX_TEAM_ITEMS) return;

        let newItems = [...state.items];
        let itemIndex = newItems.findIndex((i) => i.participantId === user.id);

        if (itemIndex === -1) {
            const newItem = makeItemFromUser(user);
            newItems.push(newItem);
            itemIndex = newItems.length - 1;
        }
        
        newItems[itemIndex] = { ...newItems[itemIndex], status: 'sold', bidderTeamId: team.id };

        const newUsers = [...state.users];
        newUsers[userIndex] = { ...user, teamId: team.id };

        const newTeams = [...state.teams];
        newTeams[teamIndex] = { ...team, itemsWon: [...team.itemsWon, newItems[itemIndex].id] };

        const hasUnbidUsers = newUsers.some((u) => u.role === USER_ROLE.GENERAL && u.teamId === null);
        const hasVacancy = newTeams.some((t) => t.itemsWon.length < MAX_TEAM_ITEMS);
        const canAssign = hasUnbidUsers && hasVacancy;

        Store.setState({
            users: newUsers, 
            teams: newTeams, 
            items: newItems,
            auctionState: {
                ...state.auctionState,
                postAuctionView: canAssign ? 'unbid' : 'results',
            }
        });
    },

    // --- Auction Lifecycle ---
    canAnyTeamBid() {
      const { teams } = state;
      return teams.some(team => team.itemsWon.length < MAX_TEAM_ITEMS && team.points > 0);
    },

    areAllUnbidItemsAssigned() {
      const { users, teams } = state;
      // Condition 1: All general users are assigned to a team
      const allUsersAssigned = !users.some(user => user.role === USER_ROLE.GENERAL && user.teamId === null);
      // Condition 2: All teams have reached their maximum capacity
      const allTeamsFull = teams.every(team => team.itemsWon.length >= MAX_TEAM_ITEMS);

      return allUsersAssigned || allTeamsFull;
    },

    startAuction() {
      let newUsers = state.users;
      let newTeams = [...state.teams];
      let newItems = [...state.items];

      const isAuctionFinished = state.items.every((item) => item.status !== 'pending');
      if (isAuctionFinished) {
        newItems = state.items.map(i => ({ ...i, status: 'pending', bidderTeamId: null, bidPrice: 0 }));
        newTeams = state.teams.map(t => ({ ...t, itemsWon: [], points: 10000 }));
        newUsers = state.users.map(u => u.role !== USER_ROLE.MASTER ? { ...u, teamId: null } : u);
      }

      Store.setState({
        users: newUsers,
        teams: newTeams,
        items: newItems,
        auctionState: {
          ...state.auctionState, // Keep saved settings
          isAuctionRunning: true,
          isAuctionPaused: true,
          isEnded: false,
          postAuctionView: 'none',
          currentAuctionItemIndex: -1,
          currentBid: 0,
          currentBidderTeamId: null,
        },
      });
    },

    nextAuction() {
      if (!state.auctionState.isAuctionRunning || !state.auctionState.isAuctionPaused) return;
      if (timerInterval) clearInterval(timerInterval);

      if (!this.canAnyTeamBid()) {
        this.endAuction();
        return;
      }

      const pendingItems = state.items.map((item, index) => ({ ...item, originalIndex: index })).filter(item => item.status === 'pending');
      if (pendingItems.length === 0) {
        this.endAuction();
        return;
      }

      const nextItemIndex = pendingItems[0].originalIndex;
      Store.setState({
        auctionState: { ...state.auctionState, currentAuctionItemIndex: nextItemIndex, currentBid: 0, currentBidderTeamId: null, timer: state.auctionState.auctionDuration, isAuctionPaused: false, currentAuctionStartTime: Date.now() }
      });
      this.startTimer();
    },

    endAuction() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      const newItems = state.items.map((item) => (item.status === 'pending' ? { ...item, status: 'unsold' } : item));

      const hasUnbidUsers = state.users.some((u) => u.role === USER_ROLE.GENERAL && u.teamId === null);
      const hasVacancy = state.teams.some((t) => t.itemsWon.length < MAX_TEAM_ITEMS);
      const canAssign = hasUnbidUsers && hasVacancy;

      Store.setState({
        items: newItems,
        auctionState: {
          ...state.auctionState,
          isAuctionRunning: false,
          isEnded: true,
          isAuctionPaused: true,
          postAuctionView: canAssign ? 'unbid' : 'results',
        },
      });
      bus.emit('auction:ended');
      bus.emit('show:alert', { message: '아래로 스크롤하여 유찰 인원 배정을 하세요', title: '경매 종료' });
    },

    handleAuctionEndRound() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;

      let newUsers = [...state.users];
      let newTeams = [...state.teams];
      let newItems = [...state.items];
      
      const currentItem = newItems[state.auctionState.currentAuctionItemIndex];
      if (!currentItem) { this.endAuction(); return; }

      if (state.auctionState.currentBid > 0 && state.auctionState.currentBidderTeamId) {
        const winningTeamIndex = newTeams.findIndex(t => t.id === state.auctionState.currentBidderTeamId);
        if (winningTeamIndex !== -1 && newTeams[winningTeamIndex].itemsWon.length < MAX_TEAM_ITEMS) {
          const winningTeam = { ...newTeams[winningTeamIndex] };
          winningTeam.points -= state.auctionState.currentBid;
          winningTeam.itemsWon = [...winningTeam.itemsWon, currentItem.id];
          
          const currentItemIndex = newItems.findIndex(i => i.id === currentItem.id);
          newItems[currentItemIndex] = { ...currentItem, status: 'sold', bidderTeamId: winningTeam.id, bidPrice: state.auctionState.currentBid };

          if (currentItem.participantId) {
            const userIndex = newUsers.findIndex(u => u.id === currentItem.participantId);
            if (userIndex !== -1) {
              newUsers[userIndex] = { ...newUsers[userIndex], teamId: winningTeam.id };
            }
          }
          newTeams[winningTeamIndex] = winningTeam;

          bus.emit('item:sold', {
            itemName: currentItem.name,
            winningTeamName: winningTeam.name,
            price: state.auctionState.currentBid,
          });
        } else {
            const currentItemIndex = newItems.findIndex(i => i.id === currentItem.id);
            newItems[currentItemIndex] = { ...currentItem, status: 'unsold' };
        }
      } else {
        const currentItemIndex = newItems.findIndex(i => i.id === currentItem.id);
        newItems[currentItemIndex] = { ...currentItem, status: 'unsold' };
      }

      Store.setState({ 
        items: newItems, 
        teams: newTeams, 
        users: newUsers, 
        auctionState: { ...state.auctionState, isAuctionPaused: true } 
      });

      if (newItems.every(item => item.status !== 'pending')) {
        this.endAuction();
      }
    },

    startTimer() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (state.auctionState.timer > 0) {
          Store.setState({ auctionState: { ...state.auctionState, timer: state.auctionState.timer - 1 } }, { persist: false });
        } else {
          clearInterval(timerInterval);
          timerInterval = null;
          if (state.currentUser?.role === USER_ROLE.MASTER) {
            Store.actions.handleAuctionEndRound();
          }
        }
      }, 1000);
    },

    masterBid(teamId, incrementAmount) {
      const { auctionState, items, teams } = state;
      const currentItem = items[auctionState.currentAuctionItemIndex];
      if (!currentItem || auctionState.timer <= 0 || auctionState.isAuctionPaused) return { success: false, message: '경매가 진행 중이 아닙니다.' };
      
      if (!this.canAnyTeamBid()) {
        return { success: false, message: '더 이상 입찰할 수 있는 팀이 없습니다.' };
      }

      const biddingTeam = teams.find(t => t.id === teamId);
      if (!biddingTeam) return { success: false, message: '팀을 찾을 수 없습니다.' };
      if (biddingTeam.itemsWon.length >= MAX_TEAM_ITEMS) return { success: false, message: '인원이 다 배정되었습니다' };

      const newBid = auctionState.currentBid + incrementAmount;
      if (biddingTeam.points < newBid) return { success: false, message: '포인트가 부족합니다' };

      const potentialOpponents = teams.filter((team) => team.id !== teamId && team.itemsWon.length < MAX_TEAM_ITEMS);
      const allOpponentsCantBid = potentialOpponents.every((team) => team.points <= newBid);

      let newTimer = auctionState.timer;
      if (newTimer <= 10) newTimer += auctionState.bidExtraTime;

      Store.setState({ auctionState: { ...auctionState, currentBid: newBid, currentBidderTeamId: teamId, timer: newTimer, currentAuctionStartTime: Date.now() } });

      if (allOpponentsCantBid) {
        Store.actions.handleAuctionEndRound();
      }
      return { success: true };
    },

    addTime(seconds) {
      if (state.auctionState.isAuctionRunning && !state.auctionState.isAuctionPaused && state.auctionState.timer > 0) {
        Store.setState({ auctionState: { ...state.auctionState, timer: state.auctionState.timer + seconds } });
      }
    },

    saveSettings(duration, extraTime) {
        Store.setState({
            auctionState: {
                ...state.auctionState,
                auctionDuration: duration,
                bidExtraTime: extraTime,
            }
        });
    },
  }
};

window.Store = Store;
