import React from 'react';

import { tagType, thirdweb } from '../assets';
import { daysLeft, calculateBarPercentage } from '../utils';

const FundCard = ({ 
  owner, 
  title, 
  description, 
  target, 
  deadline, 
  amountCollected, 
  image, 
  handleClick,
  state,
  numberOfMilestones,
  amountReleased,
  isVerified
}) => {
  const remainingDays = daysLeft(deadline);
  const progress = calculateBarPercentage(target, amountCollected);
  
  // Get state name
  const getStateName = (stateNum) => {
    const states = ['Pending', 'Verified', 'Active', 'Completed', 'Cancelled', 'Flagged'];
    return states[stateNum] || 'Active';
  }
  
  // Get state color
  const getStateColor = (stateNum) => {
    const colors = {
      0: 'bg-gray-500', // Pending
      1: 'bg-blue-500', // Verified
      2: 'bg-green-500', // Active
      3: 'bg-purple-500', // Completed
      4: 'bg-red-500', // Cancelled
      5: 'bg-red-700' // Flagged
    };
    return colors[stateNum] || 'bg-green-500';
  }
  
  // Get campaign state
  const campaignState = state !== undefined ? state : 2; // Default to Active
  
  return (
    <div className="sm:w-[288px] w-full rounded-[15px] bg-[#1c1c24] cursor-pointer transition-transform hover:scale-[1.02]" onClick={handleClick}>
      <div className="relative">
        <img src={image} alt="fund" className="w-full h-[158px] object-cover rounded-t-[15px]"/>
        
        {/* Verified Badge */}
        {isVerified && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-[#1dc071] text-white text-[10px] font-semibold flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        )}
        
        {/* State Badge */}
        <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-white text-[10px] font-semibold ${getStateColor(campaignState)}`}>
          {getStateName(campaignState)}
        </span>
      </div>

      <div className="flex flex-col p-4">
        <div className="flex flex-row items-center mb-[18px]">
          <img src={tagType} alt="tag" className="w-[17px] h-[17px] object-contain"/>
          <p className="ml-[12px] mt-[2px] font-epilogue font-medium text-[12px] text-[#808191]">Education</p>
        </div>

        <div className="block">
          <h3 className="font-epilogue font-semibold text-[16px] text-white text-left leading-[26px] truncate">{title}</h3>
          <p className="mt-[5px] font-epilogue font-normal text-[#808191] text-left leading-[18px] truncate">{description}</p>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 relative w-full h-[6px] bg-[#3a3a43] rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-[#4acd8d] rounded-full transition-all" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex justify-between flex-wrap mt-[15px] gap-2">
          <div className="flex flex-col">
            <h4 className="font-epilogue font-semibold text-[14px] text-[#b2b3bd] leading-[22px]">{amountCollected}</h4>
            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-[#808191] sm:max-w-[120px] truncate">Raised of {target}</p>
          </div>
          <div className="flex flex-col">
            <h4 className="font-epilogue font-semibold text-[14px] text-[#b2b3bd] leading-[22px]">{remainingDays}</h4>
            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-[#808191] sm:max-w-[120px] truncate">Days Left</p>
          </div>
        </div>
        
        {/* Milestones Info */}
        {numberOfMilestones > 0 && (
          <div className="flex justify-between items-center mt-[15px] pt-[15px] border-t border-[#3a3a43]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[#8c6dfd] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                M
              </span>
              <span className="font-epilogue font-normal text-[12px] text-[#808191]">
                {numberOfMilestones} Milestone{numberOfMilestones > 1 ? 's' : ''}
              </span>
            </div>
            {amountReleased && parseFloat(amountReleased) > 0 && (
              <span className="font-epilogue font-semibold text-[12px] text-[#1dc071]">
                {amountReleased} Released
              </span>
            )}
          </div>
        )}

        <div className="flex items-center mt-[20px] gap-[12px]">
          <div className="w-[30px] h-[30px] rounded-full flex justify-center items-center bg-[#13131a]">
            <img src={thirdweb} alt="user" className="w-1/2 h-1/2 object-contain"/>
          </div>
          <p className="flex-1 font-epilogue font-normal text-[12px] text-[#808191] truncate">by <span className="text-[#b2b3bd]">{owner.slice(0, 6)}...{owner.slice(-4)}</span></p>
        </div>
      </div>
    </div>
  )
}

export default FundCard
