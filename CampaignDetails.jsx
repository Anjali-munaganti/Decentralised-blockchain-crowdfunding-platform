import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { useStateContext } from '../context';
import { CountBox, CustomButton, Loader } from '../components';
import { calculateBarPercentage, daysLeft } from '../utils';
import { thirdweb } from '../assets';

const CampaignDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { donate, getDonations, contract, address, getMilestones, submitMilestoneProof, voteMilestone, finalizeMilestoneVoting, deleteCampaign } = useStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [donators, setDonators] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(0);

  const remainingDays = daysLeft(state.deadline);
  const isCampaignOwner = address && address.toLowerCase() === state.owner.toLowerCase();
  const isDonator = donators.some(d => d.donator.toLowerCase() === address?.toLowerCase());

  const fetchDonators = async () => {
    const data = await getDonations(state.pId);
    setDonators(data);
  }

  const fetchMilestones = async () => {
    if (!contract) return;
    const data = await getMilestones(state.pId);
    setMilestones(data);
  }

  useEffect(() => {
    if(contract) {
      fetchDonators();
      fetchMilestones();
    }
  }, [contract, address])

  const handleDonate = async () => {
    setIsLoading(true);
    try {
      await donate(state.pId, amount); 
      navigate('/')
    } catch (error) {
      console.error('Donation failed:', error);
    }
    setIsLoading(false);
  }

  const handleSubmitProof = async () => {
    setIsLoading(true);
    try {
      await submitMilestoneProof(state.pId, selectedMilestone);
      setShowProofModal(false);
      await fetchMilestones();
    } catch (error) {
      console.error('Failed:', error);
    }
    setIsLoading(false);
  }

  const handleVote = async (milestoneNumber, approve) => {
    setIsLoading(true);
    try {
      await voteMilestone(state.pId, milestoneNumber, approve);
      await fetchMilestones();
    } catch (error) {
      console.error('Vote failed:', error);
    }
    setIsLoading(false);
  }

  const handleFinalize = async (milestoneNumber) => {
    setIsLoading(true);
    try {
      await finalizeMilestoneVoting(state.pId, milestoneNumber);
      await fetchMilestones();
    } catch (error) {
      console.error('Finalize failed:', error);
    }
    setIsLoading(false);
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await deleteCampaign(state.pId);
        navigate('/');
      } catch (error) {
        console.error('Delete failed:', error);
        setIsLoading(false);
      }
    }
  }

  const getStateName = (num) => ['Pending', 'Submitted', 'Approved', 'Rejected'][num] || 'Unknown';
  const getStateColor = (num) => ['bg-gray-500', 'bg-yellow-500', 'bg-green-500', 'bg-red-500'][num] || 'bg-gray-500';

  return (
    <div>
      {isLoading && <Loader />}

      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img src={state.image} alt="campaign" className="w-full h-[410px] object-cover rounded-xl"/>
          <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2">
            <div className="absolute h-full bg-[#4acd8d]" style={{ width: `${calculateBarPercentage(state.target, state.amountCollected)}%` }}></div>
          </div>
        </div>

        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox title="Days Left" value={remainingDays} />
          <CountBox title="Raised" value={state.amountCollected} />
          <CountBox title="Backers" value={donators.length} />
          {state.numberOfMilestones > 0 && (
            <CountBox title="Milestones" value={state.numberOfMilestones} />
          )}
        </div>
      </div>

      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Creator</h4>
            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32]">
                <img src={thirdweb} alt="user" className="w-[60%] h-[60%] object-contain"/>
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-white break-all">{state.owner}</h4>
                <p className="mt-[4px] font-epilogue font-normal text-[12px] text-[#808191]">{state.numberOfMilestones || 0} Milestones</p>
              </div>
            </div>
          </div>

          {isCampaignOwner && (
            <div className="bg-[#1c1c24] p-4 rounded-[10px] border border-[#ff6b6b]">
              <CustomButton 
                btnType="button"
                title="Delete Campaign"
                styles="w-full bg-[#ff6b6b] hover:bg-red-700"
                handleClick={handleDelete}
              />
              <p className="font-epilogue font-normal text-[12px] text-[#ff6b6b] mt-2">
                Only campaigns with no donations can be deleted
              </p>
            </div>
          )}

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Story</h4>
            <div className="mt-[20px]">
              <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px]">{state.description}</p>
            </div>
          </div>

          {/* Startup Verification */}
          {state.isVerified && (
            <div>
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Startup Verification</h4>
              <div className="mt-[20px] p-4 bg-[#1dc071]/10 border border-[#1dc071] rounded-[10px]">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-6 h-6 text-[#1dc071]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[#1dc071] font-semibold text-[16px]">Startup Verified</span>
                </div>
                {state.startupProof && (
                  <div>
                    <p className="text-[#808191] text-[14px] mb-2">Startup Proof Document:</p>
                    <a 
                      href={state.startupProof} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1dc071] text-white rounded-[8px] text-[14px] font-semibold hover:bg-[#18a35e] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <div>
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Milestones</h4>
              <div className="mt-[20px] flex flex-col gap-4">
                {milestones.map((m, index) => (
                  <div key={index} className="p-4 bg-[#1c1c24] rounded-[10px] border border-[#3a3a43]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-epilogue font-semibold text-[16px] text-white">Milestone {m.milestoneNumber + 1}</h5>
                        <p className="text-[14px] text-[#808191] mt-1">{m.amountToRelease} ETH</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-white text-[12px] font-semibold ${getStateColor(m.state)}`}>
                        {getStateName(m.state)}
                      </span>
                    </div>
                    
                    {m.state === 1 && (
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-green-500">✓ {m.votesFor}</span>
                        <span className="text-red-500">✗ {m.votesAgainst}</span>
                      </div>
                    )}
                    
                    {isCampaignOwner && m.state === 0 && (
                      <button onClick={() => { setSelectedMilestone(m.milestoneNumber); setShowProofModal(true); }}
                        className="px-4 py-2 bg-[#8c6dfd] text-white rounded-[8px] text-[14px] font-semibold">
                        Submit Proof
                      </button>
                    )}
                    
                    {isDonator && m.state === 1 && (
                      <div className="flex gap-2">
                        <button onClick={() => handleVote(m.milestoneNumber, true)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-[8px] text-[14px] font-semibold">
                          Vote Approve
                        </button>
                        <button onClick={() => handleVote(m.milestoneNumber, false)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-[8px] text-[14px] font-semibold">
                          Vote Reject
                        </button>
                        <button onClick={() => handleFinalize(m.milestoneNumber)}
                          className="px-4 py-2 bg-[#3a3a43] text-white rounded-[8px] text-[14px] font-semibold">
                          Finalize
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Donators</h4>
            <div className="mt-[20px] flex flex-col gap-4">
              {donators.length > 0 ? donators.map((item, index) => (
                <div key={index} className="flex justify-between items-center gap-4">
                  <p className="font-epilogue font-normal text-[16px] text-[#b2b3bd]">{index + 1}. {item.donator}</p>
                  <p className="font-epilogue font-normal text-[16px] text-[#808191]">{item.donation} ETH</p>
                </div>
              )) : (
                <p className="font-epilogue font-normal text-[16px] text-[#808191]">No donators yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Fund</h4>   
          <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
            <p className="font-epilogue font-medium text-[20px] text-center text-[#808191]">Fund the campaign</p>
            <div className="mt-[30px]">
              <input 
                type="number"
                placeholder="ETH 0.1"
                step="0.01"
                className="w-full py-[10px] sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] rounded-[10px]"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <CustomButton 
                btnType="button"
                title="Fund Campaign"
                styles="w-full bg-[#8c6dfd] mt-4"
                handleClick={handleDonate}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Proof Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1c1c24] p-6 rounded-[10px] w-full max-w-md">
            <h3 className="font-epilogue font-semibold text-[20px] text-white mb-4">
              Submit Proof for Milestone {selectedMilestone + 1}
            </h3>
            <p className="text-[#808191] mb-4">Proof submission will open voting for donators.</p>
            <div className="flex gap-3">
              <CustomButton 
                btnType="button"
                title="Submit"
                styles="bg-[#1dc071] flex-1"
                handleClick={handleSubmitProof}
              />
              <CustomButton 
                btnType="button"
                title="Cancel"
                styles="bg-[#3a3a43] flex-1"
                handleClick={() => setShowProofModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CampaignDetails
