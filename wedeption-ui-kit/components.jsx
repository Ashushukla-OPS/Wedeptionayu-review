import React from 'react';
export const Card = ({children, className=''}) => <div className={"card "+className}>{children}</div>;
export const Button = ({children, onClick, className=''}) => <button className={"btn-primary "+className} onClick={onClick}>{children}</button>;
export const Header = ({title, subtitle, avatar}) => (
  <header className="header">
    {avatar && <img src={avatar} className="round-photo" alt="avatar"/>}
    <div>
      <h1 style={{margin:0}}>{title}</h1>
      {subtitle && <div className="small-muted">{subtitle}</div>}
    </div>
  </header>
);