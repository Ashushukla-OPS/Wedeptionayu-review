
export default function Footer(){ 
  return (
    <footer className="container" role="contentinfo" style={{padding:'32px 24px', marginTop:40}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <strong>Wedeption</strong>
          <div style={{color:'#6b6b6b'}}>Your everyday wedding partner</div>
        </div>
        <div style={{color:'#6b6b6b'}}>© {new Date().getFullYear()} Wedeption. All rights reserved.</div>
      </div>
    </footer>
  )
}
