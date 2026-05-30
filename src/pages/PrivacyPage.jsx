import Navbar from '../components/Navbar'
import { Link } from 'react-router-dom'

export default function PrivacyPage({ user }) {
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 800, color: '#0A2540', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #EEF5FF' }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.8 }}>{children}</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'DM Sans,sans-serif', background: '#F7F9FC', minHeight: '100vh' }}>
      <Navbar user={user} />
      <div style={{ background: 'linear-gradient(135deg,#0A2540,#1565C0)', padding: '36px 16px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>Last updated: May 2026</p>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ background: '#EEF5FF', border: '1px solid #BDD5FF', borderRadius: 10, padding: '14px 18px', marginBottom: 32, fontSize: 13, color: '#1565C0', lineHeight: 1.7 }}>
          CarExpert Africa® is committed to protecting your privacy. This policy explains how we collect, use, and protect your personal information when you use our platform.
        </div>

        <Section title="1. Who We Are">
          CarExpert Africa® ("we", "us", "our") operates the car listing platform at carexpertafrica.com and related mobile applications. We are based in Kenya and operate under Kenyan law, including the Data Protection Act 2019.
          <br/><br/>
          For privacy enquiries, contact us at: <a href="mailto:privacy@carexpertafrica.com" style={{ color: '#1565C0' }}>privacy@carexpertafrica.com</a>
        </Section>

        <Section title="2. Information We Collect">
          <strong>Information you provide:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Name, email address, and phone number when you register</li>
            <li>Car listing details including photos, price, and vehicle information</li>
            <li>Messages sent via WhatsApp or our contact forms</li>
            <li>Offer amounts and test drive booking details</li>
            <li>Newsletter subscription details</li>
          </ul>
          <br/>
          <strong>Information collected automatically:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Pages viewed and listings clicked (anonymous analytics)</li>
            <li>Device type and browser (for improving mobile experience)</li>
            <li>Recently viewed cars (stored locally on your device only)</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          We use your information to:
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Create and manage your account</li>
            <li>Display your car listings to buyers</li>
            <li>Connect buyers and sellers via WhatsApp and phone</li>
            <li>Send price drop alerts for saved cars (if opted in)</li>
            <li>Send our newsletter (only if you subscribed)</li>
            <li>Improve our platform and fix technical issues</li>
            <li>Comply with legal obligations under Kenyan law</li>
          </ul>
          <br/>
          We do <strong>not</strong> sell your personal data to third parties. We do <strong>not</strong> use your data for advertising on other platforms.
        </Section>

        <Section title="4. Phone Numbers and Contact Details">
          When you list a car, your phone number is shown publicly on your listing so buyers can contact you directly. If you prefer not to show your number publicly, you may use a separate WhatsApp number or contact us to request a private messaging option.
          <br/><br/>
          Buyers who contact you via WhatsApp are connecting directly with you — CarExpert Africa is not party to those conversations.
        </Section>

        <Section title="5. Photos and Media">
          Photos you upload to your listing are stored securely on our servers (Supabase, hosted in a secure cloud environment). They are displayed publicly as part of your listing. When you delete a listing, we will delete associated photos within 30 days.
        </Section>

        <Section title="6. Data Sharing">
          We share your data only with:
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li><strong>Supabase</strong> — our database and authentication provider</li>
            <li><strong>Vercel</strong> — our hosting provider</li>
            <li><strong>Google Maps</strong> — to show listing locations (only city/area is shared, not precise address)</li>
          </ul>
          All providers are contractually required to protect your data.
        </Section>

        <Section title="7. Cookies and Local Storage">
          We use browser local storage (not cookies) to remember:
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Your recently viewed listings (stored on your device only, never sent to our servers)</li>
            <li>Your login session token (required to keep you logged in)</li>
          </ul>
          We do not use advertising cookies or third-party tracking cookies.
        </Section>

        <Section title="8. Your Rights (Kenya Data Protection Act 2019)">
          You have the right to:
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li><strong>Access</strong> — request a copy of the data we hold about you</li>
            <li><strong>Correction</strong> — ask us to correct inaccurate data</li>
            <li><strong>Deletion</strong> — request deletion of your account and data</li>
            <li><strong>Portability</strong> — receive your data in a portable format</li>
            <li><strong>Objection</strong> — object to how we use your data</li>
          </ul>
          <br/>
          To exercise any of these rights, email <a href="mailto:privacy@carexpertafrica.com" style={{ color: '#1565C0' }}>privacy@carexpertafrica.com</a>. We will respond within 30 days.
        </Section>

        <Section title="9. Data Retention">
          <ul style={{ paddingLeft: 20 }}>
            <li>Active listings: kept while your account is active</li>
            <li>Deleted listings: removed within 30 days</li>
            <li>Account data: kept for 2 years after last login, then deleted</li>
            <li>Offer and booking records: kept for 1 year for dispute resolution</li>
            <li>Newsletter subscriptions: kept until you unsubscribe</li>
          </ul>
        </Section>

        <Section title="10. Security">
          We take reasonable technical and organisational measures to protect your data, including encrypted connections (HTTPS), secure authentication, and role-based access controls. However, no internet transmission is 100% secure. If you believe your account has been compromised, contact us immediately.
        </Section>

        <Section title="11. Children">
          CarExpert Africa is not directed at children under 18. We do not knowingly collect data from minors. If you believe a minor has provided us with personal data, please contact us and we will delete it promptly.
        </Section>

        <Section title="12. Changes to This Policy">
          We may update this policy from time to time. We will notify registered users of significant changes by email. The date at the top of this page shows when it was last updated.
        </Section>

        <div style={{ background: '#F8FAFC', border: '1.5px solid #E8EDF3', borderRadius: 12, padding: 20, marginTop: 8 }}>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 15, fontWeight: 700, color: '#0A2540', marginBottom: 8 }}>Questions?</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>We're happy to answer any privacy-related questions.</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="mailto:privacy@carexpertafrica.com" style={{ background: '#1565C0', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit,sans-serif' }}>Email Us</a>
            <Link to="/" style={{ background: '#F0F6FF', color: '#1565C0', border: '1.5px solid #BDD5FF', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit,sans-serif' }}>Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
