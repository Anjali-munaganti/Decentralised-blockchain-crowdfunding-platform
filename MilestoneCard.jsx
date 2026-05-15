import React from 'react';
import { CustomButton } from '../components';

const MilestoneCard = ({ 
  milestone, 
  isCampaignOwner, 
  isDonator, 
  onSubmitProof,
  onVote,
  onFinalizeVoting,
  onSubmitFeedback,
  feedback
}) => {
  // Get milestone state name
  const getMilestoneStateName = (stateNum) => {
    const states = ['Pending', 'Submitted', 'Approved', 'Rejected'];
    return states[stateNum] || 'Unknown';
  }
  
  // Get milestone state color
  const getMilestoneStateColor = (stateNum) => {
    const colors = {
      0: 'bg-gray-500', // Pending
      1: 'bg-yellow-500', // Submitted
      2: 'bg-green-500', // Approved
      3: 'bg-red-500' // Rejected
    };
    return colors[stateNum] || 'bg-gray-500';
  }
  
  return (
    <div className="p-4 bg-[#1c1c24] rounded-[10px] border border-[#3a3a43] hover:border-[#8c6dfd] transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h5 className="font-epilogue font-semibold text-[16px] text-white">
            Milestone {milestone.milestoneNumber + 1}
          </h5>
          {milestone.description && (
            <p className="font-epilogue font-normal text-[14px] text-[#808191] mt-1">
              {milestone.description}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-white text-[12px] font-semibold ${getMilestoneStateColor(milestone.state)}`}>
          {getMilestoneStateName(milestone.state)}
        </span>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <p className="font-epilogue font-normal text-[14px] text-[#808191]">
          Amount to Release: <span className="text-white font-semibold">{milestone.amountToRelease} ETH</span>
        </p>
        {milestone.state === 1 && ( // Submitted
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-green-500 font-bold">{milestone.votesFor}</span>
              <span className="text-[12px] text-[#808191]">✓</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-500 font-bold">{milestone.votesAgainst}</span>
              <span className="text-[12px] text-[#808191]">✗</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Progress indicator based on votes */}
      {milestone.state === 1 && (
        <div className="mb-3">
          <div className="flex w-full h-[4px] bg-[#3a3a43] rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${milestone.votesFor + milestone.votesAgainst > 0 ? (milestone.votesFor / (milestone.votesFor + milestone.votesAgainst)) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Proof of Work */}
      {milestone.proofOfWork && (
        <div className="p-3 bg-[#13131a] rounded-[8px] mb-3">
          <p className="font-epilogue font-medium text-[12px] text-[#8c6dfd] mb-1">Proof of Work Submitted:</p>
          <p className="font-epilogue font-normal text-[14px] text-[#b2b3bd]">{milestone.proofOfWork}</p>
        </div>
      )}
      
      {/* Owner Actions */}
      {isCampaignOwner && milestone.state === 0 && (
        <button
          onClick={() => onSubmitProof(milestone.milestoneNumber)}
          className="w-full mt-2 px-4 py-2 bg-[#8c6dfd] text-white rounded-[8px] text-[14px] font-semibold hover:bg-[#7c5ce0] transition-colors"
        >
          Submit Proof of Work
        </button>
      )}
      
      {isCampaignOwner && milestone.state === 3 && (
        <button
          onClick={() => onSubmitProof(milestone.milestoneNumber)}
          className="w-full mt-2 px-4 py-2 bg-[#ff6b6b] text-white rounded-[8px] text-[14px] font-semibold hover:bg-[#ff5252] transition-colors"
        >
          Resubmit Proof
        </button>
      )}
      
      {/* Donator Voting Actions */}
      {isDonator && milestone.state === 1 && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => onVote(milestone.milestoneNumber, true)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-[8px] text-[14px] font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>✓</span> Approve
            </button>
            <button
              onClick={() => onVote(milestone.milestoneNumber, false)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-[8px] text-[14px] font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>✗</span> Reject
            </button>
          </div>
          <button
            onClick={() => onFinalizeVoting(milestone.milestoneNumber)}
            className="w-full px-4 py-2 bg-[#3a3a43] text-white rounded-[8px] text-[14px] font-semibold hover:bg-[#4a4a53] transition-colors"
          >
            Finalize Voting
          </button>
        </div>
      )}
      
      {/* Donator Feedback */}
      {isDonator && (milestone.state === 1 || milestone.state === 2) && (
        <button
          onClick={() => onSubmitFeedback(milestone.milestoneNumber)}
          className="w-full mt-3 px-4 py-2 bg-[#1dc071] text-white rounded-[8px] text-[14px] font-semibold hover:bg-[#16a361] transition-colors"
        >
          Submit Feedback
        </button>
      )}
      
      {/* Display Feedback */}
      {feedback && feedback.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#3a3a43]">
          <p className="font-epilogue font-semibold text-[14px] text-white mb-2">
            Donator Feedback ({feedback.length})
          </p>
          {feedback.slice(0, 2).map((fb, fbIndex) => (
            <div key={fbIndex} className="p-3 bg-[#13131a] rounded-[8px] mb-2">
              <div className="flex justify-between items-start mb-1">
                <p className="font-epilogue font-normal text-[12px] text-[#808191] break-all">
                  {fb.donator.slice(0, 6)}...{fb.donator.slice(-4)}
                </p>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-[14px] ${i < fb.rating ? "text-yellow-500" : "text-gray-600"}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="font-epilogue font-normal text-[14px] text-[#b2b3bd]">{fb.comment}</p>
            </div>
          ))}
          {feedback.length > 2 && (
            <p className="font-epilogue font-normal text-[12px] text-[#8c6dfd]">
              +{feedback.length - 2} more feedback
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MilestoneCard;
