// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract CrowdFunding {
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        uint256 amountReleased;
        string image;
        address[] donators;
        uint256[] donations;
        uint8 state;
        uint256 createdAt;
        uint256 numMilestones;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => uint256[]) public startupCampaigns;
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneAmounts;
    mapping(uint256 => mapping(uint256 => uint8)) public milestoneStates;
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneVotesFor;
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneVotesAgainst;
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneSubmissions;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;
    mapping(uint256 => uint256) public campaignMilestoneCount;
    
    uint256 public numberOfCampaigns = 0;
    
    event CampaignCreated(uint256 indexed campaignId, address indexed owner);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event MilestoneSubmitted(uint256 indexed campaignId, uint256 milestoneNumber);
    event MilestoneVoted(uint256 indexed campaignId, uint256 milestoneNumber, address voter, bool vote);
    event MilestoneApproved(uint256 indexed campaignId, uint256 milestoneNumber, uint256 amountReleased);
    event MilestoneRejected(uint256 indexed campaignId, uint256 milestoneNumber);
    
    constructor() {}
    
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image,
        uint256 _numMilestones
    ) public returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be a future date");
        require(_numMilestones > 0 && _numMilestones <= 10);
        
        uint256 currentId = numberOfCampaigns;
        campaigns[currentId].owner = msg.sender;
        campaigns[currentId].title = _title;
        campaigns[currentId].description = _description;
        campaigns[currentId].target = _target;
        campaigns[currentId].deadline = _deadline;
        campaigns[currentId].amountCollected = 0;
        campaigns[currentId].amountReleased = 0;
        campaigns[currentId].image = _image;
        campaigns[currentId].state = 2;
        campaigns[currentId].createdAt = block.timestamp;
        campaigns[currentId].numMilestones = _numMilestones;
        
        uint256 milestoneAmount = _target / _numMilestones;
        for(uint i = 0; i < _numMilestones; i++) {
            milestoneAmounts[currentId][i] = milestoneAmount;
            milestoneStates[currentId][i] = 0;
            milestoneVotesFor[currentId][i] = 0;
            milestoneVotesAgainst[currentId][i] = 0;
        }
        
        startupCampaigns[msg.sender].push(currentId);
        numberOfCampaigns++;
        
        emit CampaignCreated(currentId, msg.sender);
        return currentId;
    }
    
    function donateToCampaign(uint256 _id) public payable {
        require(msg.value > 0);
        require(campaigns[_id].state == 1 || campaigns[_id].state == 2);
        require(campaigns[_id].amountCollected + msg.value <= campaigns[_id].target);
        
        campaigns[_id].donators.push(msg.sender);
        campaigns[_id].donations.push(msg.value);
        campaigns[_id].amountCollected += msg.value;
        
        emit DonationReceived(_id, msg.sender, msg.value);
    }
    
    function deleteCampaign(uint256 _id) public {
        require(msg.sender == campaigns[_id].owner, "Only owner");
        require(campaigns[_id].donators.length == 0, "Cannot delete campaign with donations");
        
        campaigns[_id].state = 0;
    }
    
    function submitMilestoneProof(uint256 _campaignId, uint256 _milestoneNumber) public {
        require(msg.sender == campaigns[_campaignId].owner);
        require(_milestoneNumber < campaigns[_campaignId].numMilestones);
        require(milestoneStates[_campaignId][_milestoneNumber] == 0 || milestoneStates[_campaignId][_milestoneNumber] == 3);
        
        milestoneStates[_campaignId][_milestoneNumber] = 1;
        milestoneVotesFor[_campaignId][_milestoneNumber] = 0;
        milestoneVotesAgainst[_campaignId][_milestoneNumber] = 0;
        milestoneSubmissions[_campaignId][_milestoneNumber] = block.timestamp;
        
        emit MilestoneSubmitted(_campaignId, _milestoneNumber);
    }
    
    function voteMilestone(uint256 _campaignId, uint256 _milestoneNumber, bool _approve) public {
        require(_campaignId < numberOfCampaigns);
        require(_milestoneNumber < campaigns[_campaignId].numMilestones);
        require(milestoneStates[_campaignId][_milestoneNumber] == 1);
        require(!hasVoted[_campaignId][_milestoneNumber][msg.sender]);
        
        address[] memory donators = campaigns[_campaignId].donators;
        bool isDonator = false;
        for(uint i = 0; i < donators.length; i++) {
            if(donators[i] == msg.sender) {
                isDonator = true;
                break;
            }
        }
        require(isDonator, "Only donators");
        
        hasVoted[_campaignId][_milestoneNumber][msg.sender] = true;
        if(_approve) {
            milestoneVotesFor[_campaignId][_milestoneNumber]++;
        } else {
            milestoneVotesAgainst[_campaignId][_milestoneNumber]++;
        }
        
        emit MilestoneVoted(_campaignId, _milestoneNumber, msg.sender, _approve);
    }
    
    function finalizeMilestoneVoting(uint256 _campaignId, uint256 _milestoneNumber) public {
        require(milestoneStates[_campaignId][_milestoneNumber] == 1);
        
        uint256 votesFor = milestoneVotesFor[_campaignId][_milestoneNumber];
        uint256 votesAgainst = milestoneVotesAgainst[_campaignId][_milestoneNumber];
        uint256 totalVotes = votesFor + votesAgainst;
        uint256 totalDonators = campaigns[_campaignId].donators.length;
        
        require(totalVotes >= totalDonators / 2, "Need more votes");
        
        if(votesFor > votesAgainst) {
            milestoneStates[_campaignId][_milestoneNumber] = 2;
            uint256 amount = milestoneAmounts[_campaignId][_milestoneNumber];
            campaigns[_campaignId].amountReleased += amount;
            
            (bool sent,) = payable(campaigns[_campaignId].owner).call{value: amount}("");
            require(sent);
            
            emit MilestoneApproved(_campaignId, _milestoneNumber, amount);
        } else {
            milestoneStates[_campaignId][_milestoneNumber] = 3;
            emit MilestoneRejected(_campaignId, _milestoneNumber);
        }
    }
    
    function getDonators(uint256 _id) view public returns (address[] memory, uint256[] memory) {
        return (campaigns[_id].donators, campaigns[_id].donations);
    }
    
    function getCampaigns() public view returns (uint256[] memory, address[] memory, uint256[] memory, uint256[] memory) {
        uint256[] memory ids = new uint256[](numberOfCampaigns);
        address[] memory owners = new address[](numberOfCampaigns);
        uint256[] memory targets = new uint256[](numberOfCampaigns);
        uint256[] memory collected = new uint256[](numberOfCampaigns);
        
        for(uint i = 0; i < numberOfCampaigns; i++) {
            ids[i] = i;
            owners[i] = campaigns[i].owner;
            targets[i] = campaigns[i].target;
            collected[i] = campaigns[i].amountCollected;
        }
        
        return (ids, owners, targets, collected);
    }
    
    function getCampaignInfo(uint256 _id) public view returns (address, uint256, uint256, uint256, uint8, uint256) {
        return (campaigns[_id].owner, campaigns[_id].target, campaigns[_id].amountCollected, campaigns[_id].amountReleased, campaigns[_id].state, campaigns[_id].numMilestones);
    }
    
    function getFullCampaignData(uint256 _campaignId) public view returns (uint256, address, string memory, string memory, uint256, uint256, uint256, uint256, string memory, uint8, uint256) {
        Campaign storage camp = campaigns[_campaignId];
        return (
            _campaignId,
            camp.owner,
            camp.title,
            camp.description,
            camp.target,
            camp.deadline,
            camp.amountCollected,
            camp.amountReleased,
            camp.image,
            camp.state,
            camp.numMilestones
        );
    }
    
    function getMilestone(uint256 _campaignId, uint256 _milestoneNumber) public view returns (uint256, uint8, uint256, uint256, uint256) {
        return (
            milestoneAmounts[_campaignId][_milestoneNumber],
            milestoneStates[_campaignId][_milestoneNumber],
            milestoneVotesFor[_campaignId][_milestoneNumber],
            milestoneVotesAgainst[_campaignId][_milestoneNumber],
            milestoneSubmissions[_campaignId][_milestoneNumber]
        );
    }
    
    function hasDonatorVoted(uint256 _campaignId, uint256 _milestoneNumber, address _donator) public view returns (bool) {
        return hasVoted[_campaignId][_milestoneNumber][_donator];
    }
}
