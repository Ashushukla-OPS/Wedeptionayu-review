
import Link from 'next/link'
export default function Header(){ 
  return (
    <header className="header" role="banner">
      <div className="container" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div className="brand">Wedeption</div>
          <div className="tag" style={{fontSize:12}}>Plan Smarter. Celebrate Better.</div>
        </div>
        <nav aria-label="Main navigation">
          <Link href="/"><a className="mr-4">Home</a></Link>
          <Link href="/feed"><a className="mr-4">Inspiration</a></Link>
          <Link href="/vendors"><a className="mr-4">Vendors</a></Link>
          <Link href="/vendor/dashboard"><a className="mr-4">Vendor</a></Link>
          <Link href="/signin"><a className="btn">Sign in</a></Link>
        </nav>
      </div>
    </header>
  )
}
