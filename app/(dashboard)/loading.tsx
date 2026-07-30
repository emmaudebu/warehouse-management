export default function DashboardLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '70vh',
      gap: '1.5rem',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      
      {/* Animated Forklift SVG */}
      <div className="forklift-container">
        <svg width="180" height="120" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
          {/* Speed lines for motion effect */}
          <g className="speed-lines" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
            <line className="line1" x1="150" y1="76" x2="120" y2="76" />
            <line className="line2" x1="100" y1="76" x2="50" y2="76" />
            <line className="line3" x1="30" y1="76" x2="-20" y2="76" />
          </g>

          {/* Group for the bouncing forklift body */}
          <g className="forklift-body">
            {/* Roll cage / Cabin */}
            <path d="M 20 40 L 20 15 L 45 15 L 55 40 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M 25 35 L 25 20 L 40 20 L 48 35 Z" fill="#DBEAFE"/>
            <path d="M 33 20 L 33 35" stroke="#B45309" strokeWidth="2" />
            
            {/* Main Body */}
            <rect x="10" y="40" width="60" height="25" rx="4" fill="#F59E0B" />
            {/* Engine details */}
            <rect x="15" y="45" width="10" height="15" fill="#D97706" rx="2" />
            <rect x="28" y="45" width="10" height="15" fill="#D97706" rx="2" />
            
            {/* Animated Forks & Parcel */}
            <g className="forks">
              {/* Mast */}
              <path d="M 70 10 L 75 10 L 75 65 L 70 65 Z" fill="#4B5563" />
              <path d="M 72 12 L 73 12 L 73 63 L 72 63 Z" fill="#9CA3AF" />
              
              {/* Lifting Carriage and Forks */}
              <g className="carriage">
                {/* Fork */}
                <path d="M 70 58 L 105 58 L 105 62 L 70 62 Z" fill="#6B7280" />
                {/* Parcel Box */}
                <rect x="75" y="38" width="26" height="20" fill="#A16207" rx="1" />
                <rect x="75" y="38" width="26" height="4" fill="#CA8A04" />
                {/* Parcel Tape */}
                <rect x="85" y="38" width="6" height="20" fill="#EAB308" opacity="0.6"/>
                <path d="M 80 48 L 96 48" stroke="#713F12" strokeWidth="1.5" strokeDasharray="3 2"/>
              </g>
            </g>
          </g>
          
          {/* Rear Wheel */}
          <g className="wheel" style={{ transformOrigin: '25px 65px' }}>
            <circle cx="25" cy="65" r="10" fill="#1F2937" />
            <circle cx="25" cy="65" r="4" fill="#D1D5DB" />
            <line x1="25" y1="55" x2="25" y2="75" stroke="#9CA3AF" strokeWidth="1.5" />
            <line x1="15" y1="65" x2="35" y2="65" stroke="#9CA3AF" strokeWidth="1.5" />
          </g>
          
          {/* Front Wheel */}
          <g className="wheel" style={{ transformOrigin: '55px 65px' }}>
            <circle cx="55" cy="65" r="10" fill="#1F2937" />
            <circle cx="55" cy="65" r="4" fill="#D1D5DB" />
            <line x1="55" y1="55" x2="55" y2="75" stroke="#9CA3AF" strokeWidth="1.5" />
            <line x1="45" y1="65" x2="65" y2="65" stroke="#9CA3AF" strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      <div className="loading-text" style={{
        color: 'var(--text-light)',
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.2rem'
      }}>
        Moving inventory <span className="dots"></span>
      </div>
      
      <style>{`
        .forklift-container {
          position: relative;
          overflow: hidden;
          width: 180px;
          height: 120px;
        }

        /* Bouncing effect for the forklift body */
        .forklift-body {
          animation: bump 0.4s infinite alternate ease-in-out;
        }

        /* Wheels rotating */
        .wheel {
          animation: spin 0.8s linear infinite;
        }

        /* Forks and parcel moving up and down slightly */
        .carriage {
          animation: lift 2s infinite alternate ease-in-out;
        }

        /* Ground speed lines moving left */
        .line1 { animation: dash 1s infinite linear; }
        .line2 { animation: dash 1.5s infinite linear; }
        .line3 { animation: dash 1.2s infinite linear; }

        /* Animated loading dots */
        .dots::after {
          content: '';
          animation: dots 1.5s steps(4, end) infinite;
        }

        @keyframes bump {
          from { transform: translateY(0px); }
          to { transform: translateY(1.5px); }
        }

        @keyframes lift {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(2px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes dash {
          from { transform: translateX(50px); }
          to { transform: translateX(-150px); }
        }

        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
          100% { content: ''; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
