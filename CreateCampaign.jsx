import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '../context';
import { money } from '../assets';
import { CustomButton, FormField, Loader } from '../components';
import { checkIfImage } from '../utils';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createCampaign, address } = useStateContext();
  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    target: '', 
    deadline: '',
    image: '',
    startupProof: null,
    isVerified: false
  });
  const [numberOfMilestones, setNumberOfMilestones] = useState(1);

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.title || !form.description || !form.target || !form.deadline || !form.image) {
      alert('Please fill in all fields');
      return;
    }

    checkIfImage(form.image, async (exists) => {
      if(exists) {
        setIsLoading(true);
        try {
          await createCampaign(form, numberOfMilestones);
          setIsLoading(false);
          // Wait a moment for the transaction to be confirmed
          await new Promise(resolve => setTimeout(resolve, 2000));
          navigate('/');
        } catch (error) {
          setIsLoading(false);
          console.error('Campaign creation error:', error);
        }
      } else {
        alert('Provide valid image URL');
        setForm({ ...form, image: '' });
      }
    });
  }

  return (
    <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      {isLoading && <Loader />}

      <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#3a3a43] rounded-[10px]">
        <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">Start a Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full mt-[65px] flex flex-col gap-[30px]">
        <div className="flex flex-wrap gap-[40px]">
          <FormField 
            labelName="Your Name *"
            placeholder="John Doe"
            inputType="text"
            value={form.name}
            handleChange={(e) => handleFormFieldChange('name', e)}
          />
          <FormField 
            labelName="Campaign Title *"
            placeholder="Write a title"
            inputType="text"
            value={form.title}
            handleChange={(e) => handleFormFieldChange('title', e)}
          />
        </div>

        <FormField 
            labelName="Story *"
            placeholder="Write your story"
            isTextArea
            value={form.description}
            handleChange={(e) => handleFormFieldChange('description', e)}
          />

        <div className="w-full flex justify-start items-center p-4 bg-[#8c6dfd] h-[120px] rounded-[10px]">
          <img src={money} alt="money" className="w-[40px] h-[40px] object-contain"/>
          <div className="ml-[20px]">
            <h4 className="font-epilogue font-bold text-[25px] text-white">100% of raised amount</h4>
            <p className="font-epilogue font-normal text-[14px] text-white/80 mt-1">Released per milestone approval</p>
          </div>
        </div>

        <div className="p-4 bg-[#13131a] rounded-[10px] border border-[#3a3a43]">
          <h3 className="font-epilogue font-semibold text-[18px] text-white mb-4">Milestones</h3>
          <FormField 
            labelName="Number of Milestones *"
            placeholder="1"
            inputType="number"
            min="1"
            max="10"
            value={numberOfMilestones}
            handleChange={(e) => setNumberOfMilestones(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="flex flex-wrap gap-[40px]">
          <FormField 
            labelName="Goal *"
            placeholder="ETH 0.50"
            inputType="text"
            value={form.target}
            handleChange={(e) => handleFormFieldChange('target', e)}
          />
          <FormField 
            labelName="End Date *"
            placeholder="End Date"
            inputType="date"
            value={form.deadline}
            handleChange={(e) => handleFormFieldChange('deadline', e)}
          />
        </div>

        <FormField 
            labelName="Campaign image *"
            placeholder="Place image URL of your campaign"
            inputType="url"
            value={form.image}
            handleChange={(e) => handleFormFieldChange('image', e)}
          />

        {/* Startup Proof Upload */}
        <div className="p-4 bg-[#13131a] rounded-[10px] border border-[#3a3a43]">
          <h3 className="font-epilogue font-semibold text-[18px] text-white mb-4">Startup Verification</h3>
          <p className="font-epilogue font-normal text-[14px] text-[#808191] mb-4">
            Upload startup proof documents for verification
          </p>
          
          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  // Convert file to base64 for storage
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setForm({ ...form, startupProof: reader.result, isVerified: true });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full py-[10px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[14px] rounded-[10px] file:mr-4 file:py-2 file:px-4 file:rounded-[8px] file:border-0 file:text-[14px] file:font-semibold file:bg-[#8c6dfd] file:text-white hover:file:bg-[#7c5ce0]"
            />
            
            {form.isVerified && (
              <div className="flex items-center gap-2 p-3 bg-[#1dc071]/20 border border-[#1dc071] rounded-[8px]">
                <svg className="w-5 h-5 text-[#1dc071]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[#1dc071] font-semibold text-[14px]">Startup Verified</span>
              </div>
            )}
          </div>
        </div>

          <div className="flex justify-center items-center mt-[40px] gap-4">
            <CustomButton 
              btnType="submit"
              title="Submit new campaign"
              styles="bg-[#1dc071]"
            />
          </div>
      </form>
    </div>
  )
}

export default CreateCampaign
