import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using CarExpert Africa ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform. CarExpert Africa is operated by CarExpert Africa Ltd, a company registered in Kenya.`
  },
  {
    title: '2. Definitions',
    content: `"Platform" refers to the CarExpert Africa website and all associated services. "User" refers to any person who accesses or uses the Platform. "Seller" refers to any User who lists a vehicle for sale. "Buyer" refers to any User who browses or enquires about listed vehicles. "Listing" refers to a vehicle advertisement published on the Platform.`
  },
  {
    title: '3. Eligibility',
    content: `You must be at least 18 years of age to use this Platform. By using the Platform, you represent and warrant that you are 18 years or older and have the legal capacity to enter into binding agreements. Dealer accounts must represent a legitimately registered business in Kenya.`
  },
  {
    title: '4. Account Registration',
    content: `To list a vehicle or save listings, you must create an account. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration. CarExpert Africa reserves the right to suspend or terminate accounts that provide false or misleading information.`
  },
  {
    title: '5. Listing Vehicles',
    content: `Sellers are solely responsible for the accuracy of their listings. All listings must accurately describe the vehicle including its condition, mileage, year, and any known defects. Sellers must have legal ownership or authorisation to sell the vehicle. CarExpert Africa reserves the right to reject, edit, or remove any listing that violates these Terms or is deemed inappropriate. Listings must not include vehicles that are stolen, under finance without disclosure, or otherwise encumbered without clear disclosure.`
  },
  {
    title: '6. Prohibited Listings',
    content: `The following are strictly prohibited on the Platform: stolen or illegally obtained vehicles, vehicles with clocked or tampered odometers, vehicles with undisclosed outstanding finance, salvage vehicles presented as roadworthy without disclosure, duplicate listings for the same vehicle, and listings with false or misleading photographs. Violation may result in permanent account suspension and may be reported to the relevant Kenyan authorities.`
  },
  {
    title: '7. Transactions and Payments',
    content: `CarExpert Africa is a listing platform only. We do not facilitate, mediate, or guarantee any transaction between Buyers and Sellers. All negotiations, agreements, and payments are conducted directly between Buyers and Sellers. CarExpert Africa is not a party to any sale and accepts no liability for disputes arising from transactions. Buyers are strongly advised to inspect vehicles in person, verify ownership documents, and use a qualified mechanic before completing any purchase.`
  },
  {
    title: '8. Listing Fees and Subscriptions',
    content: `Free accounts may post one active listing at no charge. Paid subscription plans (Standard, Dealer Pro) are billed monthly or annually as selected. Subscription fees are non-refundable once the billing period has commenced. CarExpert Africa reserves the right to change pricing with 30 days notice to existing subscribers. Featured listing upgrades are charged separately and are non-refundable after the listing goes live.`
  },
  {
    title: '9. Intellectual Property',
    content: `All content on the Platform including logos, design, text, and software is the property of CarExpert Africa Ltd and is protected under Kenyan and international intellectual property law. Users may not reproduce, distribute, or create derivative works from Platform content without written permission. By submitting photos or content to the Platform, you grant CarExpert Africa a non-exclusive, royalty-free licence to display that content on the Platform.`
  },
  {
    title: '10. Privacy and Data',
    content: `CarExpert Africa collects and processes personal data in accordance with our Privacy Policy. By using the Platform, you consent to the collection and use of your data as described in the Privacy Policy. We do not sell personal data to third parties. Phone numbers and contact details shared in listings may be visible to other users for the purpose of facilitating enquiries.`
  },
  {
    title: '11. Disclaimers',
    content: `CarExpert Africa does not verify the accuracy of vehicle listings beyond our standard review process. We make no warranties as to the condition, roadworthiness, ownership, or legal status of any listed vehicle. The Platform is provided on an "as is" basis. CarExpert Africa does not guarantee uninterrupted or error-free access to the Platform.`
  },
  {
    title: '12. Limitation of Liability',
    content: `To the maximum extent permitted by Kenyan law, CarExpert Africa shall not be liable for any direct, indirect, incidental, or consequential loss arising from use of the Platform, including losses arising from fraudulent listings, failed transactions, or reliance on information provided by other users. Our total liability to any user shall not exceed the amount paid by that user to CarExpert Africa in the three months preceding the claim.`
  },
  {
    title: '13. Fraud and Scam Warning',
    content: `CarExpert Africa urges all users to exercise caution. Never pay a deposit or full payment before inspecting a vehicle in person. Be wary of sellers who are unwilling to meet in person or insist on unusual payment methods. CarExpert Africa will never ask you to pay via mobile money to a personal number on our behalf. Report suspicious listings to support@carexpertafrica.com.`
  },
  {
    title: '14. Governing Law',
    content: `These Terms and Conditions are governed by the laws of the Republic of Kenya. Any disputes arising from use of the Platform shall be subject to the exclusive jurisdiction of the Kenyan courts. If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force.`
  },
  {
    title: '15. Changes to Terms',
    content: `CarExpert Africa reserves the right to update these Terms at any time. Users will be notified of material changes via email or a prominent notice on the Platform. Continued use of the Platform after changes constitutes acceptance of the updated Terms.`
  },
  {
    title: '16. Contact Us',
    content: `For questions about these Terms, please contact us at: legal@carexpertafrica.com or write to CarExpert Africa Ltd, Westlands, Nairobi, Kenya.`
  },
]

export function TermsPage({ user }) {
  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', background:'#F7F9FC', minHeight:'100vh' }}>
      <Navbar user={user} />

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0A2540,#1565C0)', padding:'48px 24px', textAlign:'center' }}>
        <div style={{ color:'#4DA6FF', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:10 }}>Legal</div>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:34, fontWeight:800, color:'#fff', marginBottom:10 }}>Terms and Conditions</h1>
        <p style={{ color:'rgba(255,255,255,.55)', fontSize:14, maxWidth:480, margin:'0 auto' }}>
          Last updated: May 2025. Please read these terms carefully before using CarExpert Africa.
        </p>
      </div>

      {/* Quick nav */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EDF3', padding:'14px 24px', display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
        {['Eligibility','Listings','Transactions','Fees','Liability','Governing Law'].map(item => (
          <span key={item} style={{ fontSize:12, color:'#1565C0', fontWeight:600, padding:'4px 12px', background:'#EEF5FF', borderRadius:100, cursor:'pointer', border:'1px solid #BDD5FF' }}>{item}</span>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth:800, margin:'0 auto', padding:'40px 24px' }}>

        {/* Intro box */}
        <div style={{ background:'#FEF3C7', border:'1.5px solid #FCD34D', borderRadius:12, padding:16, marginBottom:32, display:'flex', gap:12, alignItems:'flex-start' }}>
          <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
          <div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontSize:13, fontWeight:700, color:'#92400E', marginBottom:4 }}>Important Notice</div>
            <div style={{ fontSize:12, color:'#92400E', lineHeight:1.6 }}>CarExpert Africa is a listing platform only. We do not guarantee the condition of any vehicle listed. Always inspect a vehicle in person before paying any money. Never transfer funds before receiving and verifying a vehicle.</div>
          </div>
        </div>

        {SECTIONS.map((s, i) => (
          <div key={i} style={{ marginBottom:28, paddingBottom:28, borderBottom: i < SECTIONS.length-1 ? '1px solid #F0F4F8' : 'none' }}>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:700, color:'#0A2540', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:3, height:16, background:'#1565C0', borderRadius:2, display:'inline-block', flexShrink:0 }}></span>
              {s.title}
            </h2>
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.8, margin:0 }}>{s.content}</p>
          </div>
        ))}

        {/* Footer note */}
        <div style={{ background:'#0A2540', borderRadius:14, padding:24, textAlign:'center', marginTop:16 }}>
          <div style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:700, color:'#fff', marginBottom:8 }}>Questions about our Terms?</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.55)', marginBottom:16 }}>Our team is happy to clarify anything in these Terms.</div>
          <a href="mailto:legal@carexpertafrica.com" style={{ background:'#1565C0', color:'#fff', padding:'10px 24px', borderRadius:8, fontWeight:700, fontSize:13, textDecoration:'none', fontFamily:'Outfit,sans-serif', display:'inline-block' }}>
            Contact Legal Team →
          </a>
        </div>
      </div>

      <footer style={{ background:'#060F1A', padding:'28px 24px', textAlign:'center' }}>
        <div style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:'#fff', marginBottom:6 }}>CarExpert<span style={{ color:'#4DA6FF' }}>Africa</span>®</div>
        <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:8 }}>
          <Link to="/terms" style={{ fontSize:11, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Terms</Link>
          <Link to="/privacy" style={{ fontSize:11, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Privacy Policy</Link>
          <Link to="/listings" style={{ fontSize:11, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Browse Cars</Link>
          <Link to="/list-car" style={{ fontSize:11, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Sell a Car</Link>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>Kenya's Ultimate Car Listing Platform · © 2025</div>
      </footer>
    </div>
  )
}
