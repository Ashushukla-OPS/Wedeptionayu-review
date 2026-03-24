import Footer from '../../components/Footer'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      <div className="container" style={{ maxWidth: 960, margin: '0 auto', padding: '80px 16px 40px' }}>
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '40px 32px 36px',
          boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
          border: '1px solid rgba(226,232,240,0.8)'
        }}>
          <h1 style={{
            fontSize: 30,
            fontWeight: 800,
            margin: 0,
            marginBottom: 8,
            color: 'var(--text-dark)'
          }}>
            Privacy Policy
          </h1>
          <p style={{ margin: 0, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            How Wedeption collects, uses, and protects your information.
          </p>

          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-dark)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p>
              At Wedeption, we respect your privacy and are committed to protecting the personal information you share with us.
              This Privacy Policy explains how information is collected, used, stored, and shared when you access or use the Wedeption website and mobile application.
              Throughout this policy, the terms “We”, “Us”, “Our” refer to Wedeption, and “You”, “Your” refer to users of the Platform.
            </p>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Information We Collect</h2>
            <p>
              In the course of providing wedding and event planning services, Wedeption collects certain personal information from its users.
              When you register on our platform, make enquiries, connect with vendors, or use our services, you may be required to provide details such as your name,
              email address, phone number, location, and event-related preferences. This information helps us deliver personalized recommendations and relevant services.
            </p>
            <p>
              We may also collect certain technical and usage-related information automatically, including device details, browser type, IP address, and interaction data.
              This data is used to analyze trends, improve platform functionality, and enhance security.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Use of Personal Information</h2>
            <p>
              The personal information collected by Wedeption is used to customize the content you see, facilitate communication between users and vendors, process enquiries
              and bookings, and provide customer support. We may also use your information to inform you about updates, features, or services offered on the platform.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Consent & Legal Compliance</h2>
            <p>
              By using the Wedeption platform, you consent to the collection and use of your personal information in accordance with this Privacy Policy.
              We endeavor to comply with applicable data protection and privacy laws and ensure that user data is collected and processed lawfully and fairly.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Sharing of Information</h2>
            <p>
              Wedeption does not sell or rent your personal information to third parties. However, when you submit an enquiry or booking request, relevant information may be
              shared with the respective vendors to enable them to respond to your request. We may also share limited information with trusted third-party service providers who
              assist us with analytics, communication, hosting, or payment processing, solely for operational purposes. Personal information may also be disclosed if required
              by law or legal process.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Payments & Data Security</h2>
            <p>
              All payments on Wedeption are processed through secure third-party payment gateways. Wedeption does not store users’ credit card, debit card, or banking details.
              We treat user data as a valuable asset and employ reasonable technical and organizational measures to protect it from unauthorized access, loss, or misuse.
              While we strive to safeguard your information, no method of transmission or storage is completely secure, and absolute security cannot be guaranteed.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Your Rights</h2>
            <p>
              Users have the ability to access, update, or correct their personal information through their account settings, and may request deletion of their data by contacting us.
              You are responsible for maintaining the confidentiality of your login credentials and for activity conducted through your account.
            </p>

            <p style={{ marginTop: 8 }}>
              For any questions or requests regarding this Privacy Policy or your personal information, you can write to us at{' '}
              <a href="mailto:wedeption@gmail.com" style={{ color: 'var(--accent-rose)', textDecoration: 'none', fontWeight: 600 }}>
                wedeption@gmail.com
              </a>.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

