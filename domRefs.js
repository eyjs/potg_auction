function $(id) {
  return document.getElementById(id);
}

const DOM = {
  pages: {
    login: $('loginPage'),
    master: $('masterPage'),
    auction: $('auctionPage'),
  },
  login: {
    username: $('loginUsername'),
    password: $('loginPassword'),
    loginBtn: $('loginBtn'),
    loginMessage: $('loginMessage'),
  },

  master: {
    usernameDisplay: $('masterUsernameDisplay'), // 마스터 사용자 이름 표시
    goToAuctionPageBtn: $('goToAuctionPageBtn'), // 경매 페이지로 이동 버튼
    logoutBtnMaster: $('logoutBtnMaster'), // 마스터 로그아웃 버튼
    regUsername: $('regUsername'), // 사용자 이름 입력 필드
    regPassword: $('regPassword'), // 사용자 비밀번호 입력 필드
    registerUserBtn: $('registerUserBtn'), // 사용자 등록 버튼
    regUserMessage: $('regUserMessage'), // 사용자 등록 메시지 표시용
    scaffoldBtn: $('scaffoldBtn'), // 스캐폴드 생성 버튼
    scaffoldMessage: $('scaffoldMessage'), // 스캐폴드 메시지 표시용
    teamNameInput: $('teamNameInput'), // 팀 이름 입력 필드
    createTeamBtn: $('createTeamBtn'), // 팀 생성 버튼
    createTeamMessage: $('createTeamMessage'), // 팀 생성 메시지 표시용
    createdTeamsList: $('createdTeamsList'), // 생성된 팀 목록
    addItemMessage: $('addItemMessage'), // 매물 추가 메시지 표시용
    registeredItemsList: $('registeredItemsList'), // 등록된 매물 목록
    availableUsersList: $('availableUsersList'), // 사용 가능한 사용자 목록
    dndTeamsList: $('dndTeamsList'), // 드래그 앤 드롭 팀 목록
    dndAssignMessage: $('dndAssignMessage'), // 드래그 앤 드롭 할당 메시지 표시용
    currentTeamLeadersList: $('currentTeamLeadersList'), // 현재 팀장 목록

    unbidItemAssignmentSection: $('unbidItemAssignmentSection'), // 경매에 참여하지 않은 매물 할당 섹션
    unbidItemsListMasterPage: $('unbidItemsListMasterPage'), // 경매에 참여하지 않은 매물 목록
    unbidItemsTeamsListMasterPage: $('unbidItemsTeamsListMasterPage'), // 경매에 참여하지 않은 매물 팀 목록
    unbidItemAssignMessageMasterPage: $('unbidItemAssignMessageMasterPage'), // 경매에 참여하지 않은 매물 할당 메시지 표시용

    auctionMasterControls: $('auctionMasterControls'), // 경매 마스터 컨트롤
    auctionMasterMessage: $('auctionMasterMessage'), // 경매 마스터 메시지 표시용
  },
  auction: {
    auctionPage: $('auctionPage'), // 경매 페이지
    auctionUsernameDisplay: $('auctionUsernameDisplay'), // 경매 사용자 이름 표시
    goToMasterPageBtn: $('goToMasterPageBtn'), // 마스터 페이지로 이동 버튼
    logoutBtnAuction: $('logoutBtnAuction'), // 경매 로그아웃 버튼

    teamListContainer: $('teamListContainer'), // 팀 목록 컨테이너

    noItemMessage: $('auctionNoItemMessage'), // 경매 매물이 없을 때 메시지 표시용
    currentItemImage: $('auctionCurrentItemImage'), // 현재 매물 이미지
    currentItemName: $('auctionCurrentItemName'), // 현재 매물 이름
    currentItemDescription: $('auctionCurrentItemDescription'), // 현재 매물 설명
    currentBidInfo: $('auctionCurrentBidInfo'), // 현재 입찰 정보
    currentBidValue: $('auctionCurrentBidValue'), // 현재 입찰 금액
    currentBidTeam: $('auctionCurrentBidTeam'), // 현재 입찰 팀
    timeCount: $('auctionTimeCount'), // 경매 시간 카운트

    auctionPageMasterControls: $('auctionPageMasterControls'), // 경매 페이지 마스터 컨트롤
    auctionPageStartAuctionBtn: $('auctionPageStartAuctionBtn'), // 경매 시작 버튼
    auctionPageNextAuctionBtn: $('auctionPageNextAuctionBtn'), // 다음 경매 매물 버튼
    auctionPageStopAuctionBtn: $('auctionPageStopAuctionBtn'), // 경매 중지 버튼
    auctionPageEndAuctionBtn: $('auctionPageEndAuctionBtn'), // 경매 종료 버튼
    addTimeBtnAuctionPage: $('addTimeBtnAuctionPage'), // 경매 시간 추가 버튼
    auctionPageMasterMessage: $('auctionPageMasterMessage'), // 경매 페이지 마스터 메시지 표시용
    bidButton: $('bidButton'), // 입찰 버튼

    participantGrid: $('participantGrid'), // 참여자 그리드
    auctionResultsSection: $('auctionResultsSection'), // 경매 결과 섹션

    downloadTeamResultsBtn: $('downloadTeamResultsBtn'), // 팀 결과 다운로드 버튼
    downloadAuctionResultsBtn: $('downloadJsonDataBtn'), // JSON 데이터 다운로드 버튼
  },
};
