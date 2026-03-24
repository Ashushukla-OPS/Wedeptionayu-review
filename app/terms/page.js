import Footer from '../../components/Footer'

export default function TermsPage() {
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
            Terms &amp; Conditions
          </h1>
          <p style={{ margin: 0, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
            Please read these terms carefully before using the Wedeption platform.
          </p>

          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-dark)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p>
              Wedeption (“Wedeption”, “we”, “us”, or “our”) operates a wedding and event planning platform that provides users with access to wedding-related information,
              vendor listings, recommendations, and related services through its website and mobile applications (collectively, the “Wedeption Services”).
            </p>
            <p>
              Wedeption is a technology and aggregation platform that connects users with independent wedding and event service providers (“Vendors”).
              Wedeption does not itself provide wedding or event services.
            </p>
            <p>
              By accessing or using the Wedeption Services, whether as a visitor, registered user, or vendor, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy.
              If you do not agree, you must discontinue use of the platform immediately.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Platform Role</h2>
            <p>
              Wedeption acts solely as an intermediary and facilitator between Customers and Vendors. All services are provided independently by Vendors, and any agreement, transaction,
              or service delivery is strictly between the Customer and the Vendor. Wedeption is not a party to such transactions and does not guarantee service quality, pricing, or availability.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Eligibility & Accounts</h2>
            <p>
              By using the Wedeption Services, you confirm that you are at least 18 years of age and legally capable of entering into binding agreements.
              Users may need to register an account to access certain features and are responsible for maintaining the confidentiality of their login credentials and all activity under their account.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Content & Listings</h2>
            <p>
              Users and Vendors may upload or submit content such as images, reviews, listings, and descriptions. You confirm that you own or have the legal right to use and publish such content
              and grant Wedeption a non-exclusive, royalty-free, worldwide license to use it for platform-related purposes. Wedeption reserves the right to remove content that is misleading,
              inappropriate, or unlawful.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Bookings, Reviews & Liability</h2>
            <p>
              All bookings, pricing, service delivery, and payments are managed between Customers and Vendors. Wedeption is not responsible for disputes, service failures, or contractual obligations.
              Reviews must be genuine and based on real experiences. To the maximum extent permitted by law, Wedeption is not liable for indirect, incidental, or consequential damages arising from
              use of the platform or vendor services.
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Updates & Contact</h2>
            <p>
              Wedeption may revise these Terms &amp; Conditions from time to time. Continued use of the platform after updates constitutes acceptance of the revised terms.
              These Terms are governed by the laws of India, and courts located in India shall have exclusive jurisdiction.
            </p>
            <p>
              For any queries regarding these Terms &amp; Conditions, you can contact us at{' '}
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

