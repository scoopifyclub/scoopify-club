'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Share2, Copy, QrCode, Printer, FileText, Image, Users, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function generateStandardFlyer(referralCode, employee, customData) {
  return `
SCOOPIFY CLUB
Professional Dog Waste Removal Services

${customData.text || 'Professional, reliable, and affordable dog waste removal services for your home or business.'}

WHAT WE OFFER:
• Weekly or monthly cleaning schedules
• Initial cleanup services available
• Professional, insured, and bonded
• Eco-friendly disposal methods
• Satisfaction guaranteed

REFERRAL PROGRAM:
Use code: ${referralCode}
Get $25 off your first service!

EARN RESIDUAL INCOME:
Earn $4.55/month for every customer you refer who stays active!

CONTACT:
${employee.user.firstName} ${employee.user.lastName}
${employee.user.email}
scoopifyclub.com

*Valid referral code required for discount
*New customers only
*Referral bonus: $4.55/month per active referral
  `;
}

function generateDoorHanger(referralCode, employee, customData) {
  return `
SCOOPIFY CLUB
DOOR HANGER

${customData.text || 'Professional dog waste removal coming to your neighborhood!'}

SPECIAL OFFER:
Use referral code: ${referralCode}
Get $25 off your first service!

Services start at $55/month
• Weekly cleaning
• Professional service
• Fully insured
• Satisfaction guaranteed

REFERRAL BONUS:
Earn $4.55/month for every customer you refer!

Contact: ${employee.user.email}
Website: scoopifyclub.com

*Limited time offer
*New customers only
*Referral bonus: $4.55/month per active referral
  `;
}

function generateBusinessCard(referralCode, employee, customData) {
  return `
SCOOPIFY CLUB
Professional Dog Waste Removal

${employee.user.firstName} ${employee.user.lastName}
Referral Code: ${referralCode}

Services: Weekly/Monthly cleaning
Website: scoopifyclub.com
Email: ${employee.user.email}

Use my referral code for $25 off!
Earn $4.55/month for every referral!
  `;
}

function generateSocialMediaPost(referralCode, employee, customData) {
  return `
🐕 SCOOPIFY CLUB 🐕

Professional dog waste removal services!

${customData.text || 'Keep your yard clean and your neighbors happy with our professional cleaning services.'}

✨ What we offer:
• Weekly or monthly cleaning
• Initial cleanup available
• Professional & insured
• Eco-friendly disposal

🎁 SPECIAL OFFER:
Use my referral code: ${referralCode}
Get $25 off your first service!

💰 REFERRAL BONUS:
Earn $4.55/month for every customer you refer!

Contact: ${employee.user.email}
Website: scoopifyclub.com

#DogWasteRemoval #ProfessionalCleaning #ReferralBonus #ResidualIncome
  `;
}

const ScooperFlyerSystem = ({ employeeId, referralCode, className, ...props }) => {
  const [activeTab, setActiveTab] = useState('flyers');
  const [selectedFlyer, setSelectedFlyer] = useState(null);
  const [customText, setCustomText] = useState('');
  const [flyerType, setFlyerType] = useState('standard');
  const [loading, setLoading] = useState(false);

  // Flyer templates
  const flyerTemplates = [
    {
      id: 'standard',
      name: 'Standard Business Flyer',
      description: 'Professional flyer with your referral code',
      preview: '/images/flyers/standard-flyer-preview.png',
      downloadUrl: '/api/flyers/download/standard',
      size: '8.5" x 11"',
      format: 'PDF'
    },
    {
      id: 'door-hanger',
      name: 'Door Hanger',
      description: 'Perfect for neighborhood distribution',
      preview: '/images/flyers/door-hanger-preview.png',
      downloadUrl: '/api/flyers/download/door-hanger',
      size: '8.5" x 11"',
      format: 'PDF'
    },
    {
      id: 'business-card',
      name: 'Business Card',
      description: 'Compact referral card for networking',
      preview: '/images/flyers/business-card-preview.png',
      downloadUrl: '/api/flyers/download/business-card',
      size: '3.5" x 2"',
      format: 'PDF'
    },
    {
      id: 'social-media',
      name: 'Social Media Post',
      description: 'Ready-to-post images for social platforms',
      preview: '/images/flyers/social-media-preview.png',
      downloadUrl: '/api/flyers/download/social-media',
      size: '1080 x 1080px',
      format: 'PNG'
    }
  ];

  // Custom flyer options
  const customOptions = [
    { id: 'color', label: 'Color Scheme', options: ['Blue', 'Green', 'Purple', 'Orange'] },
    { id: 'style', label: 'Design Style', options: ['Modern', 'Classic', 'Bold', 'Elegant'] },
    { id: 'language', label: 'Language', options: ['English', 'Spanish', 'Bilingual'] }
  ];

  const handleDownload = async (flyerId, customData = {}) => {
    setLoading(true);
    try {
      const response = await fetch('/api/flyers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flyerType: flyerId,
          referralCode,
          employeeId,
          customData: {
            text: customText,
            ...customData
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flyer');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scoopify-flyer-${flyerId}-${referralCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Flyer downloaded successfully!');
    } catch (error) {
      console.error('Error downloading flyer:', error);
      toast.error('Failed to download flyer');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (flyerId) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Scoopify Club - Professional Dog Waste Removal',
          text: `Check out Scoopify Club for professional dog waste removal services! Use my referral code: ${referralCode}`,
          url: `${window.location.origin}/signup?ref=${referralCode}`
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `Scoopify Club - Professional Dog Waste Removal\nUse my referral code: ${referralCode}\n${window.location.origin}/signup?ref=${referralCode}`
        );
        toast.success('Referral link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const generateQRCode = async () => {
    try {
      const response = await fetch('/api/flyers/qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode,
          employeeId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${referralCode}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('QR code downloaded!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing Flyers & Materials</h2>
          <p className="text-gray-600">
            Download and share professional marketing materials with your referral code
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Users className="h-3 w-3 mr-1" />
            Referral Code: {referralCode}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flyers">Download Flyers</TabsTrigger>
          <TabsTrigger value="custom">Custom Flyers</TabsTrigger>
          <TabsTrigger value="tracking">Referral Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="flyers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {flyerTemplates.map((flyer) => (
              <Card key={flyer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <CardTitle className="text-lg">{flyer.name}</CardTitle>
                  <CardDescription>{flyer.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <div>Size: {flyer.size}</div>
                    <div>Format: {flyer.format}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleDownload(flyer.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShare(flyer.id)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Generate additional marketing materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={generateQRCode} variant="outline">
                  <QrCode className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Materials
                </Button>
                <Button variant="outline">
                  <Image className="h-4 w-4 mr-2" />
                  Social Media Kit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Flyer</CardTitle>
              <CardDescription>Create personalized marketing materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="flyerType">Flyer Type</Label>
                  <Select value={flyerType} onValueChange={setFlyerType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select flyer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {flyerTemplates.map((flyer) => (
                        <SelectItem key={flyer.id} value={flyer.id}>
                          {flyer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label htmlFor="customText">Custom Message</Label>
                  <Input
                    id="customText"
                    placeholder="Add your personal message..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  {customOptions.map((option) => (
                    <div key={option.id}>
                      <Label htmlFor={option.id}>{option.label}</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${option.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {option.options.map((opt) => (
                            <SelectItem key={opt} value={opt.toLowerCase()}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => handleDownload(flyerType, { custom: true })}
                  disabled={loading || !flyerType}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Custom Flyer
                </Button>
                <Button variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                    <p className="text-2xl font-bold">--</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold">$--</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold">$--</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Referral Activity</CardTitle>
              <CardDescription>Track your marketing efforts and referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p>Referral tracking data will appear here</p>
                <p className="text-sm">Start sharing your flyers to see results!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScooperFlyerSystem;
