import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'system-ui'}}>
    <a href="/exam.html" style={{padding:'16px 32px',background:'#4CAF50',color:'#fff',borderRadius:'12px',textDecoration:'none',fontSize:'18px'}}>
      进入试卷智能助手
    </a>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
