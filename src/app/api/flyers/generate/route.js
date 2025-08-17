import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { calculateReferralEarnings } from '@/lib/payment-calculator';

// Force Node.js runtime for PDF generation
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { flyerType, referralCode, employeeId, customData } = await request.json();

    if (!flyerType || !referralCode || !employeeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the employee has access to this referral code
    const employee = await prisma.employee.findFirst({
      where: { 
        id: employeeId,
        user: {
          referralCode: referralCode
        }
      },
      include: { user: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Unauthorized access to referral code' }, { status: 403 });
    }

    // Calculate referral earnings (using 1-dog monthly plan as example)
    const referralEarnings = calculateReferralEarnings(55.00);

    // Generate flyer based on type
    let flyerContent;

    switch (flyerType) {
      case 'standard':
        flyerContent = generateStandardFlyer(referralCode, employee, customData, referralEarnings);
        break;
      case 'door-hanger':
        flyerContent = generateDoorHanger(referralCode, employee, customData, referralEarnings);
        break;
      case 'business-card':
        flyerContent = generateBusinessCard(referralCode, employee, customData, referralEarnings);
        break;
      case 'social-media':
        flyerContent = generateSocialMediaPost(referralCode, employee, customData, referralEarnings);
        break;
      default:
        return NextResponse.json({ error: 'Invalid flyer type' }, { status: 400 });
    }

    // For now, return a simple text-based flyer
    // In production, you'd use a PDF generation library like Puppeteer or jsPDF
    const flyerText = `
SCOOPIFY CLUB
Professional Dog Waste Removal Services

${customData.text || 'Keep your yard clean and your neighbors happy!'}

Services:
• Weekly/Monthly cleaning
• Initial cleanup available
• Professional & reliable
• Fully insured

Use Referral Code: ${referralCode}
Get $25 off your first service!

EARN RESIDUAL INCOME:
Earn $${referralEarnings}/month for every customer you refer!

Contact: ${employee.user.email}
Website: scoopifyclub.com

*Referral bonus: $${referralEarnings}/month per active referral
    `;

    // Log the flyer generation for tracking
    await prisma.flyerGeneration.create({
      data: {
        employeeId,
        flyerType,
        referralCode,
        customData: customData || {},
        generatedAt: new Date()
      }
    });

    // Return the flyer content as text (in production, this would be a PDF)
    return new NextResponse(flyerText, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="scoopify-flyer-${flyerType}-${referralCode}.txt"`
      }
    });

  } catch (error) {
    console.error('Error generating flyer:', error);
    return NextResponse.json({ error: 'Failed to generate flyer' }, { status: 500 });
  }
}

function generateStandardFlyer(referralCode, employee, customData, referralEarnings) {
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
Earn $${referralEarnings}/month for every customer you refer who stays active!

CONTACT:
${employee.user.firstName} ${employee.user.lastName}
${employee.user.email}
scoopifyclub.com

*Valid referral code required for discount
*New customers only
*Referral bonus: $${referralEarnings}/month per active referral
  `;
}

function generateDoorHanger(referralCode, employee, customData, referralEarnings) {
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
Earn $${referralEarnings}/month for every customer you refer!

Contact: ${employee.user.email}
Website: scoopifyclub.com

*Limited time offer
*New customers only
*Referral bonus: $${referralEarnings}/month per active referral
  `;
}

function generateBusinessCard(referralCode, employee, customData, referralEarnings) {
  return `
SCOOPIFY CLUB
Professional Dog Waste Removal

${employee.user.firstName} ${employee.user.lastName}
Referral Code: ${referralCode}

Services: Weekly/Monthly cleaning
Website: scoopifyclub.com
Email: ${employee.user.email}

Use my referral code for $25 off!
Earn $${referralEarnings}/month for every referral!
  `;
}

function generateSocialMediaPost(referralCode, employee, customData, referralEarnings) {
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
Earn $${referralEarnings}/month for every customer you refer!

Contact: ${employee.user.email}
Website: scoopifyclub.com

#DogWasteRemoval #ProfessionalCleaning #ReferralBonus #ResidualIncome
  `;
}
