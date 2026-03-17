"use client";

import { Scan, TrendingUp, Presentation, GitBranch, UserCheck, AlertCircle } from "lucide-react";

export function Products() {
  const products = [
    {
      id: "sourcing",
      title: "Talent Sourcing",
      description: "Dashboards reveal trends, driving smarter HR decisions from workforce data.",
      align: "text-left",
      metrics: [
        { icon: Scan, text: "Real-time metrics", color: "text-[#f64124]" },
        { icon: TrendingUp, text: "Retention trends", color: "text-[#f64124]" },
        { icon: Presentation, text: "Custom dashboards", color: "text-[#f64124]" },
      ]
    },
    {
      id: "ats",
      title: "Job Board & ATS",
      description: "Manage policies, compliance, acknowledgments—all in one place, staying ahead.",
      align: "text-right",
      metrics: [
        { icon: GitBranch, text: "Policy hub", color: "text-[#6B7280]" },
        { icon: UserCheck, text: "Staff acknowledgment", color: "text-[#6B7280]" },
        { icon: AlertCircle, text: "Compliance alerts", color: "text-[#6B7280]" },
      ]
    },
    {
      id: "assessment",
      title: "Interview Assessment",
      description: "Dashboards reveal trends, driving smarter HR decisions from workforce data.",
      align: "text-left",
      metrics: [
        { icon: Scan, text: "Real-time metrics", color: "text-[#f64124]" },
        { icon: TrendingUp, text: "Retention trends", color: "text-[#f64124]" },
        { icon: Presentation, text: "Custom dashboards", color: "text-[#f64124]" },
      ]
    },
    {
      id: "onboarding",
      title: "Talent Onboarding",
      description: "Manage policies, compliance, acknowledgments—all in one place, staying ahead.",
      align: "text-right",
      metrics: [
        { icon: GitBranch, text: "Policy hub", color: "text-[#6B7280]" },
        { icon: UserCheck, text: "Staff acknowledgment", color: "text-[#6B7280]" },
        { icon: AlertCircle, text: "Compliance alerts", color: "text-[#6B7280]" },
      ]
    }
  ];

  return (
    <section className="relative w-full py-24 bg-[#FAFAFA]" id="products">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-24 max-w-[1000px] mx-auto">
          <h2 className="text-[#111] text-[40px] md:text-[56px] font-heading font-medium leading-[1.1] tracking-tight max-w-[480px]">
            All in one Hiring <br /> Platform to hire <br />
            <span className="text-[#666]">the best talent</span>
          </h2>

          <div className="flex flex-col items-start max-w-[360px] md:pt-4">
             <div className="flex items-center gap-2 bg-[#EFEFEF] px-3 py-1.5 rounded-full mb-6 border border-black/5">
               <div className="w-2.5 h-2.5 rounded-full bg-[#f64124]" />
               <span className="text-[10px] font-mono tracking-wider font-bold text-black/60">PRODUCTS</span>
             </div>
             <p className="text-[#555] text-[14px] leading-relaxed mb-4">
               Fluxberry AI is designed as a hiring operating system — not just another ATS.
             </p>
             <p className="text-[#888] text-[14px] leading-relaxed">
               It connects sourcing, screening, evaluation, and onboarding into one continuous pipeline powered by AI.
             </p>
          </div>
        </div>

        {/* STICKY MOTION SCROLL DECK */}
        <div className="relative w-full max-w-[1000px] mx-auto pb-[10vh]">
          {products.map((product, index) => {
            const isTextLeft = product.align === "text-left";
            return (
              <div 
                key={product.id}
                className={`sticky top-[100px] w-full min-h-[440px] md:h-[500px] bg-white border border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden flex flex-col ${isTextLeft ? 'md:flex-row' : 'md:flex-row-reverse'} mb-8 md:mb-24 last:mb-0 transition-transform duration-500 ease-out z-[${10 + index}]`}
                style={{ top: `calc(100px + ${index * 16}px)` }} // Slight offsets so they stack visibly
              >
                
                {/* TEXT CONTENT PANE */}
                <div className="w-full md:w-[40%] p-8 md:p-12 flex flex-col justify-between h-full z-10 bg-white">
                  <div>
                    <h3 className="text-[22px] md:text-[26px] font-semibold text-[#111] font-heading tracking-tight mb-4">
                      {product.title}
                    </h3>
                    <p className="text-[15px] text-[#666] leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-5 mt-12 md:mt-0">
                    {product.metrics.map((metric, i) => {
                      const Icon = metric.icon;
                      return (
                         <div key={i} className="flex items-center gap-4">
                           <Icon className={`w-[22px] h-[22px] ${metric.color}`} strokeWidth={1.5} />
                           <span className="text-[#777] font-medium text-[15px]">{metric.text}</span>
                         </div>
                      );
                    })}
                  </div>
                </div>

                {/* UI MOCKUP PANE */}
                <div className="w-full md:w-[60%] bg-[#f64124] relative overflow-hidden hidden md:block border-l border-gray-100">
                   {/* The structural container pushing the dashboard down and right to look like it's bleeding off edge */}
                   <div className={`absolute ${isTextLeft ? 'top-8 left-8 right-[-24px] bottom-[-24px]' : 'top-8 right-8 left-[-24px] bottom-[-24px]'}`}>
                     <MockDashboard />
                   </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

// Highly Detailed Hand-Coded SVG/Div Mockup of the Fluxberry Dashboard
function MockDashboard() {
  const sidebarItems = ["Teams", "Calendar", "Time Off", "Projects", "Teams", "Integrations", "Benefits", "Documents"];
  const favItems = [
    { name: "Loom Mobile App", badge: "31" },
    { name: "Monday Redesign", badge: "29" },
    { name: "Udemy Courses", badge: "6" }
  ];
  
  const users = [
    { name: "James Brown", email: "james@alignful.com", role: "Marketing", since: "Since Aug", color: "bg-orange-500" },
    { name: "Sophia Williams", email: "sophia@alignful.com", role: "HR Assist", since: "Since Aug", color: "bg-yellow-500" },
    { name: "Arthur Taylor", email: "arthur@alignful.com", role: "Enterprise", since: "Since Aug", color: "bg-blue-500" },
    { name: "Emma Wright", email: "emma@alignful.com", role: "Front-end", since: "Since Aug", color: "bg-pink-500" },
    { name: "Matthew Johnson", email: "matthew@alignful.com", role: "Product D", since: "Since Aug", color: "bg-purple-500" },
    { name: "Laura Perez", email: "laura@alignful.com", role: "Customer", since: "Since Aug", color: "bg-rose-400" },
  ];

  return (
    <div className="w-full h-full bg-[#fdfafaf] rounded-tl-[16px] shadow-2xl flex border border-black/5 overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-[200px] h-full bg-[#fcf8f8] border-r border-[#faecec] p-4 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <svg width="18" height="18" viewBox="5 5 22 22" fill="none" stroke="#f64124" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><path d="M 24 8 L 14 8 A 6 6 0 0 0 8 14 L 8 18 A 6 6 0 0 0 14 24 L 24 24" /></svg>
          <span className="font-semibold text-[15px] font-heading text-[#333]">Fluxberry AI</span>
        </div>

        <div className="text-[10px] font-bold text-[#aaa] tracking-wider mb-3">MAIN</div>
        
        <div className="space-y-1 mb-8">
           <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-[#faeaea] text-[#f64124] text-[12px] font-medium relative">
             <div className="absolute left-[-16px] w-[3px] h-full bg-[#f64124] rounded-r-md" />
             <div className="w-3 h-3 rounded-[2px] border-2 border-[#f64124]" />
             Teams
           </div>
           {sidebarItems.slice(1).map((item, i) => (
             <div key={i} className="flex items-center gap-3 px-3 py-1 text-[#888] text-[12px] hover:text-[#555] cursor-pointer">
               <div className="w-3 h-3 rounded-full border-2 border-[#ccc]" />
               {item}
             </div>
           ))}
        </div>

        <div className="text-[10px] font-bold text-[#aaa] tracking-wider mb-3">FAVS</div>
        <div className="space-y-1">
          {favItems.map((item, i) => (
             <div key={i} className="flex items-center justify-between px-3 py-1 text-[#666] text-[11px]">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#f64124]" />
                 {item.name}
               </div>
               <span className="text-[#aaa] text-[10px]">{item.badge}</span>
             </div>
          ))}
        </div>

      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        
        {/* Header */}
        <div className="p-6 pb-0 border-b border-[#f0f0f0]">
          <h2 className="text-[20px] font-semibold text-[#111] mb-1">Teams</h2>
          <p className="text-[12px] text-[#888] mb-6">Manage and collaborate within your organization's teams</p>
          
          <div className="flex gap-6 border-b border-[#eee]">
            <div className="pb-3 text-[#f64124] text-[13px] font-medium border-b-2 border-[#f64124] px-2">All</div>
            <div className="pb-3 text-[#999] text-[13px] font-medium px-2">Absent</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="p-4 overflow-y-auto">
          {/* Table Header Row */}
          <div className="flex items-center px-4 py-2 border-b border-[#f5f5f5] mb-2">
            <div className="w-4 h-4 rounded border border-[#ddd] mr-4"></div>
            <div className="flex-1 text-[11px] text-[#999] font-medium uppercase tracking-wider">Name ↑</div>
            <div className="w-[120px] text-[11px] text-[#999] font-medium uppercase tracking-wider">Title ↕</div>
          </div>

          {/* User Rows */}
          <div className="space-y-1">
            {users.map((user, i) => (
              <div key={i} className={`flex items-center px-4 py-2.5 rounded-lg ${i === 0 ? 'bg-[#fdf4f4] border border-[#fce8e8]' : 'hover:bg-[#fafafa]'}`}>
                <div className={`w-3.5 h-3.5 rounded border mr-4 ${i === 0 ? 'border-[#f6base]' : 'border-[#ddd]'}`}></div>
                
                <div className="flex-1 flex items-center min-w-0">
                  <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold mr-3 flex-shrink-0 ${user.color}`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="text-[13px] font-medium text-[#222] truncate">{user.name}</div>
                    <div className="text-[11px] text-[#888] truncate">{user.email}</div>
                  </div>
                </div>

                <div className="w-[120px] flex-shrink-0 hidden sm:block">
                  <div className="text-[12px] text-[#444]">{user.role}</div>
                  <div className="text-[10px] text-[#aaa]">{user.since}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
