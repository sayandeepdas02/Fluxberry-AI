"use client";

import { Mic, Check, Plus } from "lucide-react";

export function Features() {
  return (
    <section id="features" className="w-full bg-[#FAFAFA] pb-24 border-none">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-12 gap-8">
          <h2 className="text-[40px] md:text-[56px] font-heading font-medium tracking-[-0.03em] leading-[1.05] text-[#111]">
            The platform <br />
            behind <span className="text-[#6B6B6B]">efficient</span> <br />
            <span className="text-[#6B6B6B]">hiring workflows</span>
          </h2>

          <div className="flex flex-col items-start pt-2 md:max-w-[400px] text-left md:ml-auto">
             <div className="flex items-center gap-2 bg-[#F2F2F2] px-3 py-1.5 rounded-full border border-black/5 mb-6 md:self-start shadow-sm">
               <div className="w-2.5 h-2.5 rounded-full bg-[#f64124]" />
               <span className="text-[11px] font-mono tracking-wider font-semibold text-[#111]">FEATURES</span>
             </div>
             <p className="text-[#555] text-[15px] leading-relaxed">
               Fluxberry AI is designed as a hiring operating system — not just another ATS.
               <br /><br />
               It connects sourcing, screening, evaluation, and onboarding into one continuous pipeline powered by AI.
             </p>
          </div>
        </div>

        {/* BENTO GRID CONTEXT */}
        <div className="flex flex-col gap-6 w-full mx-auto">
          
          {/* TOP ROW: 2 CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[420px]">
             
             {/* Card 1: Workflow Automation */}
             <div className="flex flex-col bg-white border border-black/5 rounded-[24px] shadow-sm overflow-hidden h-full transform transition hover:shadow-md">
                <div className="relative flex-1 w-full flex items-center justify-center p-6 bg-[#FAFAFA] overflow-hidden min-h-[260px]">
                   {/* Centered Graphic Container */}
                   <div className="flex items-center w-full max-w-[420px] justify-between relative z-10 mx-auto">
                      
                      {/* Left Block */}
                      <div className="bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[14px] p-3 w-[150px] relative z-20">
                         <div className="text-[10px] font-bold mb-3 flex items-center justify-between text-[#111]">Upcoming tasks <span className="bg-gray-100 text-gray-400 px-1 rounded">...</span></div>
                         <div className="flex items-start gap-2 mb-2.5 relative">
                            <div className="absolute left-0 top-[2px] bottom-[2px] w-[2px] bg-[#f64124] rounded-full" />
                            <div className="pl-2">
                              <div className="text-[9.5px] font-bold leading-tight text-[#111]">Approve expense request</div>
                              <div className="text-[7.5px] text-gray-400 mt-[2px] font-medium">09:00 AM</div>
                            </div>
                         </div>
                         <div className="flex items-start gap-2 mb-2.5 relative">
                            <div className="absolute left-0 top-[2px] bottom-[2px] w-[2px] bg-[#f64124] rounded-full" />
                            <div className="pl-2">
                              <div className="text-[9.5px] font-bold leading-tight text-[#111]">Update project status</div>
                              <div className="text-[7.5px] text-gray-400 mt-[2px] font-medium">10:45 AM</div>
                            </div>
                         </div>
                         <div className="flex flex-col gap-2 relative opacity-50">
                            <div className="pl-2 relative">
                              <div className="absolute left-0 top-[2px] bottom-[2px] w-[2px] bg-[#f64124] rounded-full" />
                              <div className="pl-2">
                                <div className="text-[9.5px] font-bold leading-tight text-[#111]">Sync customer data to <br/> spreadsheet</div>
                                <div className="text-[7.5px] text-gray-400 mt-[2px] font-medium">01:30 PM - 02:00 PM</div>
                              </div>
                            </div>
                         </div>
                         <div className="flex flex-col gap-2 relative opacity-20 mt-2">
                            <div className="pl-2 relative">
                              <div className="text-[9.5px] font-bold leading-tight text-[#111]">Send weekly ops report</div>
                            </div>
                         </div>
                      </div>
                      
                      {/* Center Node */}
                      <div className="w-[52px] h-[52px] bg-[#f64124] border-[4px] border-white shadow-[0_4px_16px_rgba(246,65,36,0.3)] rounded-[16px] flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                         <svg width="24" height="24" viewBox="5 5 22 22" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><path d="M 24 8 L 14 8 A 6 6 0 0 0 8 14 L 8 18 A 6 6 0 0 0 14 24 L 24 24" /></svg>
                      </div>

                      {/* Right Output Blocks */}
                      <div className="flex flex-col gap-3 w-[150px] relative z-20">
                         <div className="bg-white border border-black/5 shadow-sm rounded-full py-1.5 px-2 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#f64124] text-white flex items-center justify-center shrink-0"><Check size={10} strokeWidth={4}/></div>
                            <span className="text-[8.5px] font-semibold text-[#111]">Approve expense request</span>
                         </div>
                         <div className="bg-white border border-black/5 shadow-sm rounded-full py-1.5 px-2 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#f64124] text-white flex items-center justify-center shrink-0"><Check size={10} strokeWidth={4}/></div>
                            <span className="text-[8.5px] font-semibold text-[#111]">Update project status</span>
                         </div>
                         <div className="bg-white border border-black/5 shadow-sm rounded-full py-1.5 px-2 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#f64124] text-white flex items-center justify-center shrink-0"><Check size={10} strokeWidth={4}/></div>
                            <span className="text-[8.5px] font-semibold text-[#111]">Sync customer data to spreadsheet</span>
                         </div>
                         <div className="bg-white border border-black/5 shadow-sm rounded-full py-1.5 px-2 flex items-center gap-2 opacity-50">
                            <div className="w-4 h-4 rounded-full bg-[#444] text-white flex items-center justify-center shrink-0"><Check size={10} strokeWidth={4}/></div>
                            <span className="text-[8.5px] font-semibold text-[#111]">Send weekly ops report</span>
                         </div>
                      </div>

                      {/* Simulated Connecting Lines */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                         {/* Left to Mid */}
                         <path d="M150 130 C180 130, 190 130, 210 130" fill="none" stroke="#f64124" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                         <path d="M150 130 C180 130, 190 130, 210 130" fill="none" stroke="#f64124" strokeWidth="1" opacity="0.8" />
                         
                         {/* Mid to Right 1 */}
                         <path d="M250 130 C270 130, 250 82, 270 82" fill="none" stroke="#f64124" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                         {/* Mid to Right 2 */}
                         <path d="M250 130 C270 130, 250 115, 270 115" fill="none" stroke="#f64124" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                         {/* Mid to Right 3 */}
                         <path d="M250 130 C270 130, 250 148, 270 148" fill="none" stroke="#f64124" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                         {/* Mid to Right 4 */}
                         <path d="M250 130 C270 130, 250 180, 270 180" fill="none" stroke="#444" strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />
                      </svg>

                   </div>
                </div>
                {/* Bottom Text */}
                <div className="p-8 flex items-end bg-white border-t border-black/5 shrink-0 h-[38%]">
                   <div>
                       <h3 className="text-[22px] font-semibold mb-2.5 text-[#111] font-heading tracking-tight">Workflow Automation</h3>
                       <p className="text-[#555] text-[15px] leading-[1.6]">
                         Automate repetitive hiring tasks across tools — from outreach and screening to scheduling and follow-ups — so your team spends less time coordinating and more time making decisions.
                       </p>
                   </div>
                </div>
             </div>

             {/* Card 2: Speak your workflows */}
             <div className="flex flex-col bg-white border border-black/5 rounded-[24px] shadow-sm overflow-hidden h-full transform transition hover:shadow-md">
                <div className="relative flex-1 w-full flex items-center justify-center p-6 bg-[#FAFAFA] overflow-hidden min-h-[260px]">
                   {/* Decorative background glow & dots */}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[300px] h-[160px] bg-[#f64124]/15 blur-[50px] rounded-[100%]" />
                      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, #f64124 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.15, maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 50%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 10%, transparent 50%)' }} />
                   </div>
                   
                   {/* Input Pill */}
                   <div className="relative z-10 flex items-center justify-between bg-white border border-[#f64124]/15 shadow-[0_8px_32px_rgba(246,65,36,0.08)] rounded-full px-2 py-2 w-[280px]">
                      <span className="text-[14px] font-medium text-[#222] ml-4 font-heading">Ask me to automate anything...</span>
                      <div className="w-9 h-9 rounded-full bg-[#f64124] flex items-center justify-center text-white shadow-md">
                         <Mic strokeWidth={2.5} className="w-[16px] h-[16px]" />
                      </div>
                   </div>
                </div>
                <div className="p-8 flex items-end bg-white border-t border-black/5 shrink-0 h-[38%]">
                   <div>
                       <h3 className="text-[22px] font-semibold mb-2.5 text-[#111] font-heading tracking-tight">Speak your workflows</h3>
                       <p className="text-[#555] text-[15px] leading-[1.6]">
                         Describe what needs to happen, and Fluxberry AI turns it into structured workflows — tasks, updates, approvals, and follow-ups — automatically executed across your hiring pipeline.
                       </p>
                   </div>
                </div>
             </div>

          </div>

          {/* BOTTOM ROW: 3 COLS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[480px]">
             
             {/* Card 3 (Col 1): Live workflow status */}
             <div className="flex flex-col bg-white border border-black/5 rounded-[24px] shadow-sm overflow-hidden h-full transform transition hover:shadow-md lg:col-span-1">
                <div className="relative flex-1 w-full flex flex-col items-center justify-center p-6 bg-[#FAFAFA] overflow-hidden min-h-[260px]">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[200px] h-[200px] bg-[#f64124]/10 blur-[50px] rounded-[100%]" />
                      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, #f64124 1px, transparent 1px)', backgroundSize: '12px 12px', opacity: 0.1, maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 60%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 60%)' }} />
                   </div>
                   
                   {/* Stacked Pills */}
                   <div className="relative z-10 flex flex-col gap-3 w-[90%] max-w-[280px]">
                      
                      <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-[14px] p-2.5 flex items-center gap-3 w-full transform -rotate-1 relative left-2">
                         <div className="w-8 h-8 shrink-0 rounded-full border-[3px] border-gray-100 relative items-center justify-center flex">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                               <circle cx="16" cy="16" r="14" fill="none" stroke="#f64124" strokeWidth="4" strokeDasharray="87.96" strokeDashoffset="15" strokeLinecap="round" />
                            </svg>
                         </div>
                         <div className="flex-1">
                           <div className="text-[12px] font-bold text-[#111] leading-tight">Quarterly budget review</div>
                           <div className="text-[9px] text-gray-400 mt-0.5">Finance review in progress</div>
                         </div>
                         {/* Tiny Profile Face */}
                         <div className="w-5 h-5 shrink-0 rounded-full bg-slate-200 border border-white overflow-hidden shadow-sm flex items-center justify-center text-[8px]">👩</div>
                      </div>

                      <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-[14px] p-2.5 flex items-center gap-3 w-[96%] opacity-90 relative -left-1">
                         <div className="w-8 h-8 shrink-0 rounded-full border-[3px] border-gray-100 relative items-center justify-center flex">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                               <circle cx="16" cy="16" r="14" fill="none" stroke="#f64124" strokeWidth="4" strokeDasharray="87.96" strokeDashoffset="50" strokeLinecap="round" />
                            </svg>
                         </div>
                         <div className="flex-1">
                           <div className="text-[12px] font-bold text-[#111] leading-tight">Hiring approval</div>
                           <div className="text-[9px] text-gray-400 mt-0.5">Waiting for final sign off</div>
                         </div>
                         {/* Tiny Profile Face */}
                         <div className="w-5 h-5 shrink-0 rounded-full bg-slate-300 border border-white overflow-hidden shadow-sm flex items-center justify-center text-[8px]">👨</div>
                      </div>

                      <div className="bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-[14px] p-2.5 flex items-center gap-3 w-[100%] opacity-80 relative left-3 transform rotate-1">
                         <div className="w-8 h-8 shrink-0 rounded-full border-[3px] border-gray-100 relative items-center justify-center flex">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                               <circle cx="16" cy="16" r="14" fill="none" stroke="#f64124" strokeWidth="4" strokeDasharray="87.96" strokeDashoffset="8" strokeLinecap="round"/>
                            </svg>
                         </div>
                         <div className="flex-1">
                           <div className="text-[12px] font-bold text-[#111] leading-tight">Website launch</div>
                           <div className="text-[9px] text-gray-400 mt-0.5">Final tasks 90% complete</div>
                         </div>
                         <div className="w-5 h-5 shrink-0 rounded-full bg-slate-400 border border-white overflow-hidden shadow-sm flex items-center justify-center text-[8px]">👱</div>
                      </div>

                   </div>
                </div>
                <div className="p-8 flex items-end bg-white border-t border-black/5 shrink-0 h-[36%]">
                   <div>
                       <h3 className="text-[22px] font-semibold mb-2.5 text-[#111] font-heading tracking-tight">Live workflow status</h3>
                       <p className="text-[#555] text-[14px] leading-relaxed">
                         Track candidate progress, ownership, and stage updates in real time — without switching between tools or chasing updates across teams.
                       </p>
                   </div>
                </div>
             </div>
             
             {/* Center Stack (Col 2): Tools & Automate Badge */}
             <div className="flex flex-col gap-6 h-full lg:col-span-1">
                
                {/* Fits naturally into the tools you trust */}
                <div className="flex-1 w-full bg-[#FAFAFA] border border-black/5 rounded-[24px] shadow-sm flex flex-col p-6 overflow-hidden transform transition hover:shadow-md relative">
                   <div className="text-[#6B6B6B] text-[20px] md:text-[24px] font-heading leading-tight tracking-[-0.03em] mb-4 w-[85%] relative z-20">
                     Fits naturally <br/>
                     into <span className="text-[#111] font-semibold">the tools<br/>you trust</span>
                   </div>
                   
                   {/* Absolute/relative logos scatter */}
                   <div className="absolute inset-0 opacity-90 pointer-events-none">
                      {/* Slack Style */}
                      <div className="absolute right-[12%] top-[25%] w-[42px] h-[42px] bg-white border border-black/5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-red-500 font-bold text-xl">#</div>
                      {/* Drive Style */}
                      <div className="absolute right-[32%] top-[10%] w-[38px] h-[38px] bg-white border border-black/5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-green-500 font-bold text-lg">▲</div>
                      {/* Google */}
                      <div className="absolute left-[38%] top-[50%] w-[38px] h-[38px] bg-white border border-black/5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-orange-500 font-bold text-xl font-heading">G</div>
                      {/* Kit */}
                      <div className="absolute right-[35%] top-[52%] w-[42px] h-[42px] bg-black text-white border-2 border-white rounded-[10px] flex items-center justify-center text-[13px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.06)]">Kit</div>
                      {/* Notion */}
                      <div className="absolute right-[8%] top-[55%] w-[40px] h-[40px] bg-white border-2 border-black/10 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center font-bold font-serif text-xl">N</div>
                      {/* Jira */}
                      <div className="absolute left-[15%] bottom-[12%] w-[42px] h-[42px] bg-blue-600 text-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center font-bold text-lg">J</div>
                      {/* Dropbox */}
                      <div className="absolute left-[40%] bottom-[8%] w-[38px] h-[38px] bg-white border border-black/5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-blue-500 font-bold">D</div>
                      {/* Generic Mail/Lines */}
                      <div className="absolute right-[36%] bottom-[10%] w-[44px] h-[44px] bg-white/80 border border-black/5 backdrop-blur-sm rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center font-bold text-indigo-500">M</div>
                      {/* Gmail mock */}
                      <div className="absolute right-[10%] bottom-[15%] w-[38px] h-[38px] bg-white border border-black/5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center text-red-500 font-bold">M</div>
                   </div>
                </div>

                {/* Designed to automate repetitive manual interviews */}
                <div className="h-[120px] shrink-0 w-full bg-[#FAFAFA] border border-black/5 rounded-[24px] shadow-sm flex items-center p-6 gap-5 transform transition hover:shadow-md">
                   <div className="w-[48px] h-[48px] shrink-0 bg-[#222] rounded-[16px] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="5 5 22 22" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><path d="M 24 8 L 14 8 A 6 6 0 0 0 8 14 L 8 18 A 6 6 0 0 0 14 24 L 24 24" /></svg>
                   </div>
                   <div className="text-[#6B6B6B] text-[16px] font-heading leading-[1.3] tracking-[-0.01em]">
                     Designed to <br/>
                     automate <span className="text-[#111] font-bold">repetitive <br />manual interviews</span>
                   </div>
                </div>

             </div>

             {/* Card 6 (Col 3): Shared work without chaos */}
             <div className="flex flex-col bg-white border border-black/5 rounded-[24px] shadow-sm overflow-hidden h-full transform transition hover:shadow-md lg:col-span-1">
                <div className="relative flex-1 w-full flex items-center justify-center p-6 bg-[#FAFAFA] min-h-[260px]">
                    
                    <div className="bg-white border border-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-[18px] w-[95%] max-w-[280px] p-5 pb-12 relative flex flex-col gap-4">
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[13px] font-bold text-[#111]">Team members</span>
                          <div className="w-6 h-3 bg-gray-100 border border-black/5 rounded-full flex gap-0.5 items-center justify-center">
                             <span className="w-[3px] h-[3px] bg-gray-400 rounded-full"/>
                             <span className="w-[3px] h-[3px] bg-gray-400 rounded-full"/>
                             <span className="w-[3px] h-[3px] bg-gray-400 rounded-full"/>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-3.5">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[12px] shadow-sm">👩🏻‍💼</div>
                                <div>
                                  <div className="text-[12px] font-bold text-[#111]">Emma Collins</div>
                                  <div className="text-[10px] text-gray-400">@emma.c</div>
                                </div>
                             </div>
                             <span className="text-[10px] font-medium text-gray-500">Admin</span>
                          </div>

                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[12px] shadow-sm">👨🏼‍💻</div>
                                <div>
                                  <div className="text-[12px] font-bold text-[#111]">Lukas Meyer</div>
                                  <div className="text-[10px] text-gray-400">@lukas.m</div>
                                </div>
                             </div>
                             <span className="text-[10px] font-medium text-gray-500">Member</span>
                          </div>

                          <div className="flex items-center justify-between opacity-[0.35] blur-[1px]">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-[12px] shadow-sm">👩🏽‍🎨</div>
                                <div>
                                  <div className="text-[12px] font-bold text-[#111]">Sophia...</div>
                                  <div className="text-[10px] text-gray-400">...</div>
                                </div>
                             </div>
                             <span className="text-[10px] font-medium text-gray-500">Member</span>
                          </div>
                       </div>

                       {/* Floating add button */}
                       <div className="absolute bottom-6 left-[60%] shrink-0 -translate-x-1/2 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-black/5 rounded-full pr-4 pl-[5px] py-[5px] flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                           <div className="w-7 h-7 rounded-full bg-[#f64124] text-white flex items-center justify-center"><Plus size={16} /></div>
                           <span className="text-[11px] font-semibold text-[#111]">Add members</span>
                       </div>
                    </div>

                </div>
                <div className="p-8 flex items-end bg-white border-t border-black/5 shrink-0 h-[36%]">
                   <div>
                       <h3 className="text-[22px] font-semibold mb-2.5 text-[#111] font-heading tracking-tight">Shared work without chaos</h3>
                       <p className="text-[#555] text-[14px] leading-relaxed">
                         Keep recruiters, hiring managers, and interviewers aligned with clear ownership, automated handoffs, and centralised communication — all in one place.
                       </p>
                   </div>
                </div>
             </div>

          </div>

        </div>
      </div>
    </section>
  );
}
