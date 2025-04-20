 // SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

// import "forge-std/Test.sol";

interface ISansuCoin {
    function mint(address to, uint256 amount) external;
}

contract StakingWithEmissions {
    mapping(address => uint) stakes;
  
    uint256 public constant REWARD_PER_SEC_PER_ETH = 1e18;
    
    ISansuCoin public sansuCoin;

    uint256 public totalStakedBalance;

    struct UserInfo {
        uint256 stakedAmount;
        uint256 rewardDebt;
        uint256 lastUpdate;
    }

    mapping(address => UserInfo) public userInfo;

    constructor(ISansuCoin _token) {
        sansuCoin = _token;
    }
    function updateToken(address _newToken) external {
        // In production, you'd want to add access control here
        sansuCoin = ISansuCoin(_newToken);
    }

    function _updateRewards(address _user) internal {
    UserInfo storage user = userInfo[_user];

    if (user.lastUpdate == 0) {
        user.lastUpdate = block.timestamp;
        return;
    }

    uint256 timeDiff = block.timestamp - user.lastUpdate;
    if (timeDiff == 0) return;

    // Updated reward calculation
    uint256 additionalReward = (user.stakedAmount * timeDiff * REWARD_PER_SEC_PER_ETH) / 1e18;
    user.rewardDebt += additionalReward;
    user.lastUpdate = block.timestamp;
}

    function stake(uint256 _amount) external payable {
        require(_amount > 0, "Cannot stake 0");
        require(msg.value == _amount, "ETH amount mismatch");

        _updateRewards(msg.sender);

        userInfo[msg.sender].stakedAmount += _amount;
        totalStakedBalance += _amount;
    }

    function unstake(uint _amount) public payable {
       require(_amount > 0, "Cannot unstake 0");
        UserInfo storage user = userInfo[msg.sender];
        require(user.stakedAmount >= _amount, "Not enough staked");

        _updateRewards(msg.sender);
        user.stakedAmount -= _amount;
       
        totalStakedBalance -= _amount;

        payable(msg.sender).transfer(_amount);
    }

    function claimEmissions() public {
        _updateRewards(msg.sender);
        UserInfo storage user = userInfo[msg.sender];
        sansuCoin.mint(msg.sender, user.rewardDebt);
        user.rewardDebt = 0;
    }

    // function getRewards() public view returns (uint) {
    //     uint256 timeDiff = block.timestamp - userInfo[msg.sender].lastUpdate;
    //     if (timeDiff == 0) {
    //         return userInfo[msg.sender].rewardDebt;
    //     }

    //     return (userInfo[msg.sender].stakedAmount * timeDiff * REWARD_PER_SEC_PER_ETH) + userInfo[msg.sender].rewardDebt;
    // }
    function getRewards(address _user) public view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        if (user.lastUpdate == 0) return 0;
        
        uint256 timeDiff = block.timestamp - user.lastUpdate;
        if (timeDiff == 0) {
            return user.rewardDebt;
        }

       
        uint256 pendingRewards = (user.stakedAmount * timeDiff * REWARD_PER_SEC_PER_ETH) / 1e18;
        return pendingRewards + user.rewardDebt;
    }

    function totalStaked() public view returns (uint256) {
        return totalStakedBalance;
    }
}