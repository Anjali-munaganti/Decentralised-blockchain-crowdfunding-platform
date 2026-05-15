import React, { useContext, createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const StateContext = createContext();

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 1337);
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || 'Hardhat Local';
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

const CONTRACT_ABI = [
  "function createCampaign(string memory _title, string memory _description, uint256 _target, uint256 _deadline, string memory _image, uint256 _numMilestones) public returns (uint256)",
  "function getCampaigns() public view returns (uint256[] memory, address[] memory, uint256[] memory, uint256[] memory)",
  "function donateToCampaign(uint256 _id) public payable",
  "function deleteCampaign(uint256 _id) public",
  "function getDonators(uint256 _id) view returns (address[] memory, uint256[] memory)",
  "function getCampaignInfo(uint256 _id) public view returns (address, uint256, uint256, uint256, uint8, uint256)",
  "function getFullCampaignData(uint256 _campaignId) public view returns (uint256, address, string memory, string memory, uint256, uint256, uint256, uint256, string memory, uint8, uint256)",
  "function getMilestone(uint256 _campaignId, uint256 _milestoneNumber) public view returns (uint256, uint8, uint256, uint256, uint256)",
  "function submitMilestoneProof(uint256 _campaignId, uint256 _milestoneNumber) public",
  "function voteMilestone(uint256 _campaignId, uint256 _milestoneNumber, bool _approve) public",
  "function finalizeMilestoneVoting(uint256 _campaignId, uint256 _milestoneNumber) public",
  "function hasDonatorVoted(uint256 _campaignId, uint256 _milestoneNumber, address _donator) public view returns (bool)"
];

export const StateContextProvider = ({ children }) => {
  const [address, setAddress] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [walletType, setWalletType] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const getContractInstance = (web3Provider) => {
    if (!CONTRACT_ADDRESS) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, web3Provider.getSigner());
  };

  const checkNetwork = async (ethereum) => {
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    const matches = Number.parseInt(chainIdHex, 16) === CHAIN_ID;
    setIsCorrectNetwork(matches);
    return matches;
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(web3Provider);

    window.ethereum.request({ method: 'eth_accounts' })
      .then(async (accounts) => {
        await checkNetwork(window.ethereum);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setContract(getContractInstance(web3Provider));
        }
      });

    const handleAccountsChanged = (accounts) => setAddress(accounts[0] || '');
    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    return () => window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
  }, []);


  const connect = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return;
      }

      let ethereum = window.ethereum;
      if (window.ethereum.providers?.length) {
        const metamaskProvider = window.ethereum.providers.find((p) => p.isMetaMask);
        ethereum = metamaskProvider || window.ethereum.providers[0];
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = new ethers.providers.Web3Provider(ethereum);
      setProvider(web3Provider);
      setAddress(accounts[0]);
      setContract(getContractInstance(web3Provider));
      await checkNetwork(ethereum);

      alert('Connected!');
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to connect');
    }
  };

  const createCampaign = async (form, numberOfMilestones = 1) => {
    if (!address) {
      alert('Please connect wallet');
      return;
    }
    try {
      const cleanTarget = form.target.toString().replace(/[^0-9.]/g, '');
      const deadline = Math.floor(new Date(form.deadline).getTime() / 1000);

      const tx = await contract.createCampaign(
        form.title,
        form.description,
        ethers.utils.parseEther(cleanTarget),
        deadline,
        form.image,
        numberOfMilestones
      );
      await tx.wait();
      
      // Store verification data in localStorage
      const campaignId = await contract.getCampaigns();
      const newId = campaignId[0][campaignId[0].length - 1].toString();
      const verificationData = {
        startupProof: form.startupProof,
        isVerified: form.isVerified
      };
      localStorage.setItem(`campaign_${newId}_verification`, JSON.stringify(verificationData));
      
      alert('Campaign created!');
    } catch (error) {
      console.error('Campaign creation failed:', error);
      alert('Failed: ' + (error.reason || error.message));
    }
  };

  const getCampaigns = async () => {
    if (!contract) return [];
    try {
      const campaigns = await contract.getCampaigns();
      const parsedCampaigns = [];
      for (let i = 0; i < campaigns[0].length; i++) {
        const campaignId = campaigns[0][i];
        const fullData = await contract.getFullCampaignData(campaignId);
        const donators = await contract.getDonators(campaignId);
        
        // Get verification data from localStorage
        const campaignIdStr = fullData[0].toString();
        let verificationData = { startupProof: null, isVerified: false };
        try {
          const stored = localStorage.getItem(`campaign_${campaignIdStr}_verification`);
          if (stored) {
            verificationData = JSON.parse(stored);
          }
        } catch (e) {
          console.warn('Failed to load verification data:', e);
        }
        
        parsedCampaigns.push({
          pId: campaignIdStr,
          owner: fullData[1],
          title: fullData[2],
          description: fullData[3],
          target: ethers.utils.formatEther(fullData[4].toString()),
          deadline: Number(fullData[5]),
          amountCollected: ethers.utils.formatEther(fullData[6].toString()),
          amountReleased: ethers.utils.formatEther(fullData[7].toString()),
          image: fullData[8],
          state: Number(fullData[9]),
          donators: donators[0],
          donations: donators[1].map(d => ethers.utils.formatEther(d.toString())),
          numberOfMilestones: Number(fullData[10]),
          startupProof: verificationData.startupProof,
          isVerified: verificationData.isVerified
        });
      }
      return parsedCampaigns;
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      return [];
    }
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    return allCampaigns.filter((campaign) => campaign.owner === address);
  };

  const donate = async (pId, amount) => {
    if (!contract) return null;
    try {
      const tx = await contract.donateToCampaign(pId, { value: ethers.utils.parseEther(amount) });
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Donation failed:', error);
      throw error;
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!contract) return null;
    try {
      const tx = await contract.deleteCampaign(campaignId);
      await tx.wait();
      alert('Campaign deleted successfully!');
      return tx;
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete campaign: ' + (error.reason || error.message));
      throw error;
    }
  };

  const getDonations = async (pId) => {
    if (!contract) return [];
    try {
      const donations = await contract.getDonators(pId);
      const parsedDonations = [];
      for (let i = 0; i < donations[0].length; i++) {
        parsedDonations.push({
          donator: donations[0][i],
          donation: ethers.utils.formatEther(donations[1][i].toString())
        });
      }
      return parsedDonations;
    } catch (error) {
      console.error('Failed to get donations:', error);
      return [];
    }
  };

  const getMilestones = async (campaignId) => {
    if (!contract) return [];
    try {
      const milestones = [];
      const campaignInfo = await contract.getCampaignInfo(campaignId);
      const numMilestones = Number(campaignInfo[5]);
      for (let i = 0; i < numMilestones; i++) {
        const m = await contract.getMilestone(campaignId, i);
        milestones.push({
          milestoneNumber: i,
          amountToRelease: ethers.utils.formatEther(m[0].toString()),
          state: Number(m[1]),
          votesFor: Number(m[2]),
          votesAgainst: Number(m[3]),
          submissionTime: Number(m[4])
        });
      }
      return milestones;
    } catch (error) {
      console.error('Failed to get milestones:', error);
      return [];
    }
  };

  const submitMilestoneProof = async (campaignId, milestoneNumber) => {
    if (!contract) return null;
    try {
      const tx = await contract.submitMilestoneProof(campaignId, milestoneNumber);
      await tx.wait();
      alert('Proof submitted!');
    } catch (error) {
      console.error('Failed:', error);
      alert('Failed: ' + (error.reason || error.message));
    }
  };

  const voteMilestone = async (campaignId, milestoneNumber, approve) => {
    if (!contract) return null;
    try {
      const tx = await contract.voteMilestone(campaignId, milestoneNumber, approve);
      await tx.wait();
      alert(approve ? 'Voted to approve!' : 'Voted to reject!');
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Failed: ' + (error.reason || error.message));
    }
  };

  const finalizeMilestoneVoting = async (campaignId, milestoneNumber) => {
    if (!contract) return null;
    try {
      const tx = await contract.finalizeMilestoneVoting(campaignId, milestoneNumber);
      await tx.wait();
      alert('Voting finalized!');
    } catch (error) {
      console.error('Finalize failed:', error);
      alert('Failed: ' + (error.reason || error.message));
    }
  };

  const hasDonatorVoted = async (campaignId, milestoneNumber, donator) => {
    if (!contract) return false;
    try {
      return await contract.hasDonatorVoted(campaignId, milestoneNumber, donator);
    } catch (error) {
      return false;
    }
  };

  return (
    <StateContext.Provider
      value={{
        address, contract, provider, walletType,
        isCorrectNetwork,
        connect, createCampaign, deleteCampaign,
        getCampaigns, getUserCampaigns, donate, getDonations,
        getMilestones, submitMilestoneProof, voteMilestone,
        finalizeMilestoneVoting, hasDonatorVoted
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
