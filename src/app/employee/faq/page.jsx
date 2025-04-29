'use client';
import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
const faqItems = [
    {
        question: "How do I upload service photos?",
        answer: "After completing the service, click the 'Upload Photos' button. You'll need to take 4 corner photos before and after the service. Make sure all photos are clear and show the entire area."
    },
    {
        question: "What should I do if the weather is bad?",
        answer: "If the weather conditions make it unsafe or impossible to perform the service, click the 'Report Weather Delay' button. This will notify the customer and allow us to reschedule the service."
    },
    {
        question: "How do I leave a message for a customer?",
        answer: "Use the message feature in the service details page. You can leave notes about the service, report any issues, or provide special instructions for next time."
    },
    {
        question: "What are the safety guidelines?",
        answer: "1. Always wear gloves and use proper tools\n2. Be aware of your surroundings\n3. Watch for aggressive animals\n4. Stay hydrated and take breaks as needed\n5. Report any safety concerns immediately"
    },
    {
        question: "How do I handle gate codes?",
        answer: "Gate codes are provided in the service details. Make sure to close and secure the gate after completing the service. Never share gate codes with anyone else."
    },
    {
        question: "When do I get paid?",
        answer: "Payments are processed every Friday. You'll receive 75% of the subscription fee for each completed service. Payments are made via Cash App, cash, or check as specified."
    },
    {
        question: "What should I do if I can't access a property?",
        answer: "If you can't access the property due to locked gates, aggressive animals, or other issues, leave a message for the customer and contact support immediately."
    },
    {
        question: "How do I complete the service checklist?",
        answer: "After uploading photos, you'll need to complete the checklist by confirming all tasks are done: corners cleaned, waste disposed, area raked, and gate secured."
    }
];
export default function FAQPage() {
    const [openItems, setOpenItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const filteredItems = useMemo(() => {
        if (!searchQuery)
            return faqItems;
        const query = searchQuery.toLowerCase();
        return faqItems.filter(item => item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query));
    }, [searchQuery]);
    const toggleItem = (index) => {
        setOpenItems(prev => prev.includes(index)
            ? prev.filter(i => i !== index)
            : [...prev, index]);
    };
    return (<div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Employee FAQ</h1>
      
      <div className="relative mb-8">
        <div className="relative">
          <input type="text" placeholder="Search FAQs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"/>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
        </div>
      </div>
      
      {filteredItems.length === 0 ? (<div className="text-center py-8 text-gray-500">
          No results found for "{searchQuery}"
        </div>) : (<div className="space-y-4">
          {filteredItems.map((item, index) => (<div key={index} className="border rounded-lg overflow-hidden">
              <button onClick={() => toggleItem(index)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100">
                <span className="font-medium text-left">{item.question}</span>
                {openItems.includes(index) ? (<ChevronUp className="h-5 w-5"/>) : (<ChevronDown className="h-5 w-5"/>)}
              </button>
              
              {openItems.includes(index) && (<div className="p-4 bg-white">
                  <p className="whitespace-pre-line">{item.answer}</p>
                </div>)}
            </div>))}
        </div>)}
    </div>);
}
